package database

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"microservice-go-gin/internal/domain/entity"
	"microservice-go-gin/internal/domain/repository"
)

type voteRepository struct {
	db *gorm.DB
}

func NewVoteRepository(db *gorm.DB) repository.VoteRepository {
	return &voteRepository{db: db}
}

func (r *voteRepository) Create(ctx context.Context, vote *entity.Vote) error {
	return r.db.WithContext(ctx).Create(vote).Error
}

func (r *voteRepository) GetByPollAndVoter(ctx context.Context, pollID uuid.UUID, voterID string) ([]*entity.Vote, error) {
	var votes []*entity.Vote
	err := r.db.WithContext(ctx).
		Where("poll_id = ? AND voter_id = ?", pollID, voterID).
		Find(&votes).Error
	return votes, err
}

func (r *voteRepository) CountByOption(ctx context.Context, optionID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.Vote{}).
		Where("option_id = ?", optionID).
		Count(&count).Error
	return count, err
}

func (r *voteRepository) CountByPoll(ctx context.Context, pollID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.Vote{}).
		Where("poll_id = ?", pollID).
		Count(&count).Error
	return count, err
}

func (r *voteRepository) GetVotesByPoll(ctx context.Context, pollID uuid.UUID) ([]*entity.Vote, error) {
	var votes []*entity.Vote
	err := r.db.WithContext(ctx).
		Where("poll_id = ?", pollID).
		Find(&votes).Error
	return votes, err
}

func (r *voteRepository) HasVoted(ctx context.Context, pollID uuid.UUID, voterID string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.Vote{}).
		Where("poll_id = ? AND voter_id = ?", pollID, voterID).
		Count(&count).Error
	return count > 0, err
}