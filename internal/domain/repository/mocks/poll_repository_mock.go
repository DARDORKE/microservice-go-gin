package mocks

import (
	"context"

	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
	"microservice-go-gin/internal/domain/entity"
)

type MockPollRepository struct {
	mock.Mock
}

func (m *MockPollRepository) Create(ctx context.Context, poll *entity.Poll) error {
	args := m.Called(ctx, poll)
	return args.Error(0)
}

func (m *MockPollRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Poll, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Poll), args.Error(1)
}

func (m *MockPollRepository) GetByIDWithResults(ctx context.Context, id uuid.UUID) (*entity.Poll, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Poll), args.Error(1)
}

func (m *MockPollRepository) Update(ctx context.Context, poll *entity.Poll) error {
	args := m.Called(ctx, poll)
	return args.Error(0)
}

func (m *MockPollRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockPollRepository) List(ctx context.Context, offset, limit int) ([]*entity.Poll, error) {
	args := m.Called(ctx, offset, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*entity.Poll), args.Error(1)
}

func (m *MockPollRepository) GetActivePolls(ctx context.Context, offset, limit int) ([]*entity.Poll, error) {
	args := m.Called(ctx, offset, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*entity.Poll), args.Error(1)
}

func (m *MockPollRepository) GetPollsByCreator(ctx context.Context, creatorID string, offset, limit int) ([]*entity.Poll, error) {
	args := m.Called(ctx, creatorID, offset, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*entity.Poll), args.Error(1)
}