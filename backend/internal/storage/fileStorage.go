package storage

import (
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

const servicesUploadDir = "uploads/services"
const postsUploadDir = "uploads/posts"
const chatUploadDir = "uploads/chat"

func SaveServiceImage(file *multipart.FileHeader) (string, error) {
	if file == nil {
		return "", fmt.Errorf("image is required")
	}

	extension := strings.ToLower(filepath.Ext(file.Filename))

	allowedExtensions := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".webp": true,
	}

	if !allowedExtensions[extension] {
		return "", fmt.Errorf("invalid image format")
	}

	if err := os.MkdirAll(servicesUploadDir, os.ModePerm); err != nil {
		return "", err
	}

	fileName := uuid.New().String() + extension

	filePath := filepath.Join(
		servicesUploadDir,
		fileName,
	)

	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	dst, err := os.Create(filePath)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	buffer := make([]byte, 32*1024)

	for {
		n, readErr := src.Read(buffer)

		if n > 0 {
			if _, err := dst.Write(buffer[:n]); err != nil {
				return "", err
			}
		}

		if readErr != nil {
			break
		}
	}

	imagePath := "/uploads/services/" + fileName

	return imagePath, nil
}

func DeleteServiceImage(imagePath string) error {
	if imagePath == "" {
		return nil
	}

	fileName := filepath.Base(imagePath)

	filePath := filepath.Join(
		servicesUploadDir,
		fileName,
	)

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil
	}

	return os.Remove(filePath)
}

func SavePostImage(file *multipart.FileHeader) (string, error) {
	if file == nil {
		return "", fmt.Errorf("image is required")
	}

	extension := strings.ToLower(filepath.Ext(file.Filename))
	allowedExtensions := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true}
	if !allowedExtensions[extension] {
		return "", fmt.Errorf("invalid image format")
	}
	if err := os.MkdirAll(postsUploadDir, os.ModePerm); err != nil {
		return "", err
	}

	fileName := uuid.New().String() + extension
	filePath := filepath.Join(postsUploadDir, fileName)
	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()
	dst, err := os.Create(filePath)
	if err != nil {
		return "", err
	}
	defer dst.Close()
	if _, err := dst.ReadFrom(src); err != nil {
		return "", err
	}
	return "/uploads/posts/" + fileName, nil
}

func DeletePostImage(imagePath string) error {
	if imagePath == "" {
		return nil
	}
	filePath := filepath.Join(postsUploadDir, filepath.Base(imagePath))
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil
	}
	return os.Remove(filePath)
}

func SaveChatImage(file *multipart.FileHeader) (string, error) {
	if file == nil {
		return "", fmt.Errorf("image is required")
	}
	if file.Size > 5*1024*1024 {
		return "", fmt.Errorf("image cannot exceed 5 MB")
	}
	extension := strings.ToLower(filepath.Ext(file.Filename))
	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true}
	if !allowed[extension] {
		return "", fmt.Errorf("invalid image format")
	}
	if err := os.MkdirAll(chatUploadDir, os.ModePerm); err != nil {
		return "", err
	}
	name := uuid.New().String() + extension
	path := filepath.Join(chatUploadDir, name)
	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()
	dst, err := os.Create(path)
	if err != nil {
		return "", err
	}
	defer dst.Close()
	if _, err := dst.ReadFrom(src); err != nil {
		return "", err
	}
	return "/uploads/chat/" + name, nil
}

func DeleteChatImage(imagePath string) error {
	if imagePath == "" {
		return nil
	}
	path := filepath.Join(chatUploadDir, filepath.Base(imagePath))
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return nil
	}
	return os.Remove(path)
}
