package repository

import (
	"context"

	"github.com/google/uuid"
	"microservice-go-gin/internal/domain/entity"
)

type VoteRepository interface {
	Create(ctx context.Context, vote *entity.Vote) error
	GetByPollAndVoter(ctx context.Context, pollID uuid.UUID, voterID string) ([]*entity.Vote, error)
	CountByOption(ctx context.Context, optionID uuid.UUID) (int64, error)
	CountByPoll(ctx context.Context, pollID uuid.UUID) (int64, error)
	GetVotesByPoll(ctx context.Context, pollID uuid.UUID) ([]*entity.Vote, error)
	HasVoted(ctx context.Context, pollID uuid.UUID, voterID string) (bool, error)
}