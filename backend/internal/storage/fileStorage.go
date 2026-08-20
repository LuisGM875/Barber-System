package storage

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"path"
	"strings"
	"time"

	"github.com/google/uuid"
)

const maxImageSize = 5 * 1024 * 1024

var imageContentTypes = map[string]string{
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".png":  "image/png",
	".webp": "image/webp",
	".gif":  "image/gif",
}

type storageClient struct {
	baseURL    string
	serviceKey string
	bucket     string
	httpClient *http.Client
}

var client *storageClient

func Configure(baseURL, serviceKey, bucket string) error {
	baseURL = strings.TrimRight(strings.TrimSpace(baseURL), "/")
	serviceKey = strings.TrimSpace(serviceKey)
	bucket = strings.TrimSpace(bucket)

	if baseURL == "" || serviceKey == "" || bucket == "" {
		return errors.New("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y SUPABASE_STORAGE_BUCKET son obligatorios")
	}

	parsedURL, err := url.Parse(baseURL)
	if err != nil || parsedURL.Scheme != "https" || parsedURL.Host == "" {
		return errors.New("SUPABASE_URL debe ser una URL HTTPS válida")
	}

	client = &storageClient{
		baseURL:    baseURL,
		serviceKey: serviceKey,
		bucket:     bucket,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}

	return nil
}

func SaveServiceImage(file *multipart.FileHeader) (string, error) {
	return saveImage("services", file, false)
}

func DeleteServiceImage(imageURL string) error {
	return deleteImage(imageURL, "services")
}

func SavePostImage(file *multipart.FileHeader) (string, error) {
	return saveImage("posts", file, false)
}

func DeletePostImage(imageURL string) error {
	return deleteImage(imageURL, "posts")
}

func SaveChatImage(file *multipart.FileHeader) (string, error) {
	return saveImage("chat", file, true)
}

func DeleteChatImage(imageURL string) error {
	return deleteImage(imageURL, "chat")
}

func saveImage(folder string, file *multipart.FileHeader, allowGIF bool) (string, error) {
	if client == nil {
		return "", errors.New("Supabase Storage no está configurado")
	}
	if file == nil {
		return "", errors.New("image is required")
	}
	if file.Size <= 0 || file.Size > maxImageSize {
		return "", errors.New("image cannot exceed 5 MB")
	}

	extension := strings.ToLower(path.Ext(file.Filename))
	contentType, allowed := imageContentTypes[extension]
	if !allowed || (extension == ".gif" && !allowGIF) {
		return "", errors.New("invalid image format")
	}

	objectPath := folder + "/" + uuid.NewString() + extension
	source, err := file.Open()
	if err != nil {
		return "", err
	}
	defer source.Close()

	endpoint := client.baseURL + "/storage/v1/object/" + escapePath(client.bucket) + "/" + escapePath(objectPath)
	request, err := http.NewRequest(http.MethodPost, endpoint, source)
	if err != nil {
		return "", err
	}
	request.ContentLength = file.Size
	request.Header.Set("Authorization", "Bearer "+client.serviceKey)
	request.Header.Set("apikey", client.serviceKey)
	request.Header.Set("Content-Type", contentType)
	request.Header.Set("Cache-Control", "public, max-age=3600")
	request.Header.Set("x-upsert", "false")

	response, err := client.httpClient.Do(request)
	if err != nil {
		return "", fmt.Errorf("cannot upload image to Supabase Storage: %w", err)
	}
	defer response.Body.Close()

	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return "", storageResponseError("upload", response)
	}

	return client.baseURL + "/storage/v1/object/public/" + escapePath(client.bucket) + "/" + escapePath(objectPath), nil
}

func deleteImage(imageURL, legacyFolder string) error {
	if imageURL == "" {
		return nil
	}
	if client == nil {
		return errors.New("Supabase Storage no está configurado")
	}

	objectPath, ok := objectPathFromURL(imageURL, legacyFolder)
	if !ok {
		return nil
	}

	payload, err := json.Marshal(map[string][]string{"prefixes": []string{objectPath}})
	if err != nil {
		return err
	}
	endpoint := client.baseURL + "/storage/v1/object/" + escapePath(client.bucket)
	request, err := http.NewRequest(http.MethodDelete, endpoint, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	request.Header.Set("Authorization", "Bearer "+client.serviceKey)
	request.Header.Set("apikey", client.serviceKey)
	request.Header.Set("Content-Type", "application/json")

	response, err := client.httpClient.Do(request)
	if err != nil {
		return fmt.Errorf("cannot delete image from Supabase Storage: %w", err)
	}
	defer response.Body.Close()

	if response.StatusCode == http.StatusNotFound {
		return nil
	}
	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return storageResponseError("delete", response)
	}

	return nil
}

func objectPathFromURL(imageURL, legacyFolder string) (string, bool) {
	publicPrefix := client.baseURL + "/storage/v1/object/public/" + escapePath(client.bucket) + "/"
	if strings.HasPrefix(imageURL, publicPrefix) {
		objectPath, err := url.PathUnescape(strings.TrimPrefix(imageURL, publicPrefix))
		return objectPath, err == nil && objectPath != ""
	}

	legacyPrefix := "/uploads/" + legacyFolder + "/"
	if strings.HasPrefix(imageURL, legacyPrefix) {
		return legacyFolder + "/" + path.Base(imageURL), true
	}

	return "", false
}

func escapePath(value string) string {
	segments := strings.Split(value, "/")
	for index, segment := range segments {
		segments[index] = url.PathEscape(segment)
	}
	return strings.Join(segments, "/")
}

func storageResponseError(operation string, response *http.Response) error {
	body, _ := io.ReadAll(io.LimitReader(response.Body, 4096))
	message := strings.TrimSpace(string(body))
	if message == "" {
		message = response.Status
	}
	return fmt.Errorf("Supabase Storage %s failed (%d): %s", operation, response.StatusCode, message)
}
