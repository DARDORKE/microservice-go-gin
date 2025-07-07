package mocks

import (
	"context"

	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
	"microservice-go-gin/internal/domain/entity"
)

type MockVoteRepository struct {
	mock.Mock
}

func (m *MockVoteRepository) Create(ctx context.Context, vote *entity.Vote) error {
	args := m.Called(ctx, vote)
	return args.Error(0)
}

func (m *MockVoteRepository) GetByPollAndVoter(ctx context.Context, pollID uuid.UUID, voterID string) ([]*entity.Vote, error) {
	args := m.Called(ctx, pollID, voterID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*entity.Vote), args.Error(1)
}

func (m *MockVoteRepository) CountByOption(ctx context.Context, optionID uuid.UUID) (int64, error) {
	args := m.Called(ctx, optionID)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockVoteRepository) CountByPoll(ctx context.Context, pollID uuid.UUID) (int64, error) {
	args := m.Called(ctx, pollID)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockVoteRepository) GetVotesByPoll(ctx context.Context, pollID uuid.UUID) ([]*entity.Vote, error) {
	args := m.Called(ctx, pollID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*entity.Vote), args.Error(1)
}

func (m *MockVoteRepository) HasVoted(ctx context.Context, pollID uuid.UUID, voterID string) (bool, error) {
	args := m.Called(ctx, pollID, voterID)
	return args.Bool(0), args.Error(1)
}