package vote_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"microservice-go-gin/internal/domain/entity"
	"microservice-go-gin/internal/domain/repository/mocks"
	"microservice-go-gin/internal/usecase/vote"
)

func TestCreateVoteUseCase_Execute(t *testing.T) {
	pollID := uuid.New()
	option1ID := uuid.New()
	option2ID := uuid.New()
	invalidOptionID := uuid.New()

	validPoll := &entity.Poll{
		ID:          pollID,
		Title:       "Test Poll",
		MultiChoice: false,
		RequireAuth: false,
		ExpiresAt:   nil,
		Options: []entity.Option{
			{ID: option1ID, Text: "Option 1"},
			{ID: option2ID, Text: "Option 2"},
		},
	}

	expiredPoll := &entity.Poll{
		ID:          pollID,
		Title:       "Expired Poll",
		MultiChoice: false,
		RequireAuth: false,
		ExpiresAt:   timePtr(time.Now().Add(-1 * time.Hour)),
		Options: []entity.Option{
			{ID: option1ID, Text: "Option 1"},
		},
	}

	authRequiredPoll := &entity.Poll{
		ID:          pollID,
		Title:       "Auth Required Poll",
		MultiChoice: false,
		RequireAuth: true,
		ExpiresAt:   nil,
		Options: []entity.Option{
			{ID: option1ID, Text: "Option 1"},
		},
	}

	multiChoicePoll := &entity.Poll{
		ID:          pollID,
		Title:       "Multi Choice Poll",
		MultiChoice: true,
		RequireAuth: false,
		ExpiresAt:   nil,
		Options: []entity.Option{
			{ID: option1ID, Text: "Option 1"},
			{ID: option2ID, Text: "Option 2"},
		},
	}

	tests := []struct {
		name     string
		input    vote.CreateVoteInput
		mockPoll *entity.Poll
		hasVoted bool
		wantErr  bool
		errMsg   string
	}{
		{
			name: "successful single vote",
			input: vote.CreateVoteInput{
				PollID:    pollID,
				OptionIDs: []uuid.UUID{option1ID},
				VoterID:   "voter1",
				IPAddress: "192.168.1.1",
				UserAgent: "test-agent",
			},
			mockPoll: validPoll,
			hasVoted: false,
			wantErr:  false,
		},
		{
			name: "successful multi choice vote",
			input: vote.CreateVoteInput{
				PollID:    pollID,
				OptionIDs: []uuid.UUID{option1ID, option2ID},
				VoterID:   "voter1",
				IPAddress: "192.168.1.1",
				UserAgent: "test-agent",
			},
			mockPoll: multiChoicePoll,
			hasVoted: false,
			wantErr:  false,
		},
		{
			name: "poll not found",
			input: vote.CreateVoteInput{
				PollID:    pollID,
				OptionIDs: []uuid.UUID{option1ID},
				VoterID:   "voter1",
			},
			mockPoll: nil,
			hasVoted: false,
			wantErr:  true,
			errMsg:   "poll not found",
		},
		{
			name: "poll expired",
			input: vote.CreateVoteInput{
				PollID:    pollID,
				OptionIDs: []uuid.UUID{option1ID},
				VoterID:   "voter1",
			},
			mockPoll: expiredPoll,
			hasVoted: false,
			wantErr:  true,
			errMsg:   "poll has expired",
		},
		{
			name: "authentication required",
			input: vote.CreateVoteInput{
				PollID:    pollID,
				OptionIDs: []uuid.UUID{option1ID},
				VoterID:   "",
			},
			mockPoll: authRequiredPoll,
			hasVoted: false,
			wantErr:  true,
			errMsg:   "authentication required to vote",
		},
		{
			name: "already voted",
			input: vote.CreateVoteInput{
				PollID:    pollID,
				OptionIDs: []uuid.UUID{option1ID},
				VoterID:   "voter1",
			},
			mockPoll: validPoll,
			hasVoted: true,
			wantErr:  true,
			errMsg:   "you have already voted in this poll",
		},
		{
			name: "multiple options on single choice",
			input: vote.CreateVoteInput{
				PollID:    pollID,
				OptionIDs: []uuid.UUID{option1ID, option2ID},
				VoterID:   "voter1",
			},
			mockPoll: validPoll,
			hasVoted: false,
			wantErr:  true,
			errMsg:   "only one option can be selected",
		},
		{
			name: "invalid option",
			input: vote.CreateVoteInput{
				PollID:    pollID,
				OptionIDs: []uuid.UUID{invalidOptionID},
				VoterID:   "voter1",
			},
			mockPoll: validPoll,
			hasVoted: false,
			wantErr:  true,
			errMsg:   "invalid option selected",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockPollRepo := new(mocks.MockPollRepository)
			mockVoteRepo := new(mocks.MockVoteRepository)
			useCase := vote.NewCreateVoteUseCase(mockPollRepo, mockVoteRepo)

			if tt.mockPoll == nil {
				mockPollRepo.On("GetByID", mock.Anything, pollID).
					Return(nil, errors.New("poll not found"))
			} else {
				mockPollRepo.On("GetByID", mock.Anything, pollID).
					Return(tt.mockPoll, nil)

				// Always mock HasVoted if we get past the poll retrieval
				if tt.errMsg != "poll has expired" && tt.errMsg != "authentication required to vote" {
					mockVoteRepo.On("HasVoted", mock.Anything, pollID, tt.input.VoterID).
						Return(tt.hasVoted, nil)
				}

				if !tt.wantErr {
					// For multi-choice, we need to expect multiple Create calls
					expectedCalls := len(tt.input.OptionIDs)
					for i := 0; i < expectedCalls; i++ {
						mockVoteRepo.On("Create", mock.Anything, mock.MatchedBy(func(v *entity.Vote) bool {
							return v.PollID == pollID && v.VoterID == tt.input.VoterID &&
								   contains(tt.input.OptionIDs, v.OptionID)
						})).Return(nil).Once()
					}
				}
			}

			err := useCase.Execute(context.Background(), tt.input)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Equal(t, tt.errMsg, err.Error())
			} else {
				assert.NoError(t, err)
			}

			mockPollRepo.AssertExpectations(t)
			mockVoteRepo.AssertExpectations(t)
		})
	}
}

func timePtr(t time.Time) *time.Time {
	return &t
}

func contains(slice []uuid.UUID, item uuid.UUID) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}