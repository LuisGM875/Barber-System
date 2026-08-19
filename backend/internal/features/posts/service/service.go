package service

import (
	"errors"
	"fmt"
	"mime/multipart"
	"time"

	"github.com/LuisGM875/barbersystem/internal/features/posts/dto"
	"github.com/LuisGM875/barbersystem/internal/features/posts/models"
	"github.com/LuisGM875/barbersystem/internal/features/posts/repository"
	"github.com/LuisGM875/barbersystem/internal/storage"
)

type Service interface {
	FindAll() ([]dto.PostResponse, error)
	Create(dto.CreatePostRequest, *multipart.FileHeader) (dto.PostResponse, error)
	Update(string, dto.UpdatePostRequest, *multipart.FileHeader) (dto.PostResponse, error)
	Delete(string) error
}

type service struct{ repository repository.Repository }

func NewService(repository repository.Repository) Service { return &service{repository: repository} }

func response(post models.Post) dto.PostResponse {
	return dto.PostResponse{ID: post.ID.String(), Title: post.Title, Description: post.Description, Image: post.Image, CreatedAt: post.CreatedAt.Format(time.RFC3339), UpdatedAt: post.UpdatedAt.Format(time.RFC3339)}
}

func (service *service) FindAll() ([]dto.PostResponse, error) {
	posts, err := service.repository.FindAll()
	if err != nil {
		return nil, err
	}
	result := make([]dto.PostResponse, 0, len(posts))
	for _, post := range posts {
		result = append(result, response(post))
	}
	return result, nil
}

func (service *service) Create(request dto.CreatePostRequest, file *multipart.FileHeader) (dto.PostResponse, error) {
	imagePath, err := storage.SavePostImage(file)
	if err != nil {
		return dto.PostResponse{}, err
	}
	post := models.Post{Title: request.Title, Description: request.Description, Image: imagePath}
	if err := service.repository.Create(&post); err != nil {
		_ = storage.DeletePostImage(imagePath)
		return dto.PostResponse{}, fmt.Errorf("could not create post: %w", err)
	}
	return response(post), nil
}

func (service *service) Update(id string, request dto.UpdatePostRequest, file *multipart.FileHeader) (dto.PostResponse, error) {
	post, err := service.repository.FindByID(id)
	if err != nil {
		return dto.PostResponse{}, err
	}
	if post == nil {
		return dto.PostResponse{}, errors.New("post not found")
	}

	oldImage := post.Image
	newImage := ""
	if file != nil {
		newImage, err = storage.SavePostImage(file)
		if err != nil {
			return dto.PostResponse{}, err
		}
		post.Image = newImage
	}
	post.Title = request.Title
	post.Description = request.Description
	if err := service.repository.Update(post); err != nil {
		if newImage != "" {
			_ = storage.DeletePostImage(newImage)
		}
		return dto.PostResponse{}, err
	}
	if newImage != "" {
		_ = storage.DeletePostImage(oldImage)
	}
	return response(*post), nil
}

func (service *service) Delete(id string) error {
	post, err := service.repository.FindByID(id)
	if err != nil {
		return err
	}
	if post == nil {
		return errors.New("post not found")
	}
	if err := service.repository.Delete(id); err != nil {
		return err
	}
	return storage.DeletePostImage(post.Image)
}
