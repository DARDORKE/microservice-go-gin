package database

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"microservice-go-gin/internal/domain/entity"
	"microservice-go-gin/internal/domain/repository"
)

type pollRepository struct {
	db *gorm.DB
}

func NewPollRepository(db *gorm.DB) repository.PollRepository {
	return &pollRepository{db: db}
}

func (r *pollRepository) Create(ctx context.Context, poll *entity.Poll) error {
	return r.db.WithContext(ctx).Create(poll).Error
}

func (r *pollRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Poll, error) {
	var poll entity.Poll
	err := r.db.WithContext(ctx).Preload("Options").First(&poll, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("poll not found")
		}
		return nil, err
	}
	return &poll, nil
}

func (r *pollRepository) GetByIDWithResults(ctx context.Context, id uuid.UUID) (*entity.Poll, error) {
	var poll entity.Poll
	err := r.db.WithContext(ctx).Preload("Options").First(&poll, "id = ?", id).Error
	if err != nil {
		return nil, err
	}

	for i := range poll.Options {
		var count int64
		r.db.Model(&entity.Vote{}).Where("option_id = ?", poll.Options[i].ID).Count(&count)
		poll.Options[i].VoteCount = int(count)
	}

	return &poll, nil
}

func (r *pollRepository) Update(ctx context.Context, poll *entity.Poll) error {
	return r.db.WithContext(ctx).Save(poll).Error
}

func (r *pollRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.Poll{}, "id = ?", id).Error
}

func (r *pollRepository) List(ctx context.Context, offset, limit int) ([]*entity.Poll, error) {
	var polls []*entity.Poll
	err := r.db.WithContext(ctx).
		Offset(offset).
		Limit(limit).
		Order("created_at DESC").
		Find(&polls).Error
	return polls, err
}

func (r *pollRepository) GetActivePolls(ctx context.Context, offset, limit int) ([]*entity.Poll, error) {
	var polls []*entity.Poll
	err := r.db.WithContext(ctx).
		Where("expires_at IS NULL OR expires_at > ?", gorm.Expr("NOW()")).
		Offset(offset).
		Limit(limit).
		Order("created_at DESC").
		Find(&polls).Error
	return polls, err
}

func (r *pollRepository) GetPollsByCreator(ctx context.Context, creatorID string, offset, limit int) ([]*entity.Poll, error) {
	var polls []*entity.Poll
	err := r.db.WithContext(ctx).
		Where("created_by = ?", creatorID).
		Offset(offset).
		Limit(limit).
		Order("created_at DESC").
		Find(&polls).Error
	return polls, err
}