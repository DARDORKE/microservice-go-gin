package repository

import (
	"context"

	"github.com/google/uuid"
	"microservice-go-gin/internal/domain/entity"
)

type PollRepository interface {
	Create(ctx context.Context, poll *entity.Poll) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Poll, error)
	GetByIDWithResults(ctx context.Context, id uuid.UUID) (*entity.Poll, error)
	Update(ctx context.Context, poll *entity.Poll) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, offset, limit int) ([]*entity.Poll, error)
	GetActivePolls(ctx context.Context, offset, limit int) ([]*entity.Poll, error)
	GetPollsByCreator(ctx context.Context, creatorID string, offset, limit int) ([]*entity.Poll, error)
}