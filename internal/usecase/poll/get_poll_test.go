package poll_test

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"microservice-go-gin/internal/domain/entity"
	"microservice-go-gin/internal/domain/repository/mocks"
	"microservice-go-gin/internal/usecase/poll"
)

func TestGetPollUseCase_Execute(t *testing.T) {
	pollID := uuid.New()
	option1ID := uuid.New()
	option2ID := uuid.New()

	expectedPoll := &entity.Poll{
		ID:          pollID,
		Title:       "Test Poll",
		Description: "Test Description",
		MultiChoice: false,
		RequireAuth: false,
		Options: []entity.Option{
			{ID: option1ID, Text: "Option 1", VoteCount: 5},
			{ID: option2ID, Text: "Option 2", VoteCount: 3},
		},
	}

	tests := []struct {
		name     string
		pollID   uuid.UUID
		mockPoll *entity.Poll
		mockErr  error
		wantErr  bool
	}{
		{
			name:     "successful get poll",
			pollID:   pollID,
			mockPoll: expectedPoll,
			mockErr:  nil,
			wantErr:  false,
		},
		{
			name:     "poll not found",
			pollID:   pollID,
			mockPoll: nil,
			mockErr:  errors.New("poll not found"),
			wantErr:  true,
		},
		{
			name:     "database error",
			pollID:   pollID,
			mockPoll: nil,
			mockErr:  errors.New("database error"),
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockPollRepo := new(mocks.MockPollRepository)
			mockVoteRepo := new(mocks.MockVoteRepository)
			useCase := poll.NewGetPollUseCase(mockPollRepo, mockVoteRepo)

			mockPollRepo.On("GetByIDWithResults", mock.Anything, tt.pollID).
				Return(tt.mockPoll, tt.mockErr)

			result, err := useCase.Execute(context.Background(), tt.pollID)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
				assert.Equal(t, expectedPoll.ID, result.ID)
				assert.Equal(t, expectedPoll.Title, result.Title)
				assert.Equal(t, len(expectedPoll.Options), len(result.Options))
			}

			mockPollRepo.AssertExpectations(t)
		})
	}
}