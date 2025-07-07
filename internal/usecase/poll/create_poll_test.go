package poll_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"microservice-go-gin/internal/domain/entity"
	"microservice-go-gin/internal/domain/repository/mocks"
	"microservice-go-gin/internal/usecase/poll"
)

func TestCreatePollUseCase_Execute(t *testing.T) {
	tests := []struct {
		name    string
		input   poll.CreatePollInput
		wantErr bool
		errMsg  string
	}{
		{
			name: "successful creation",
			input: poll.CreatePollInput{
				Title:       "Test Poll",
				Description: "Test Description",
				Options:     []string{"Option 1", "Option 2", "Option 3"},
				MultiChoice: false,
				RequireAuth: false,
				CreatedBy:   "test-user",
			},
			wantErr: false,
		},
		{
			name: "creation with expiration",
			input: poll.CreatePollInput{
				Title:       "Test Poll with Expiration",
				Description: "Test Description",
				Options:     []string{"Yes", "No"},
				MultiChoice: false,
				RequireAuth: false,
				ExpiresIn:   intPtr(60),
				CreatedBy:   "test-user",
			},
			wantErr: false,
		},
		{
			name: "creation with less than 2 options",
			input: poll.CreatePollInput{
				Title:       "Invalid Poll",
				Description: "Test Description",
				Options:     []string{"Only One Option"},
				MultiChoice: false,
				RequireAuth: false,
				CreatedBy:   "test-user",
			},
			wantErr: true,
			errMsg:  "poll must have at least 2 options",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := new(mocks.MockPollRepository)
			useCase := poll.NewCreatePollUseCase(mockRepo, "http://localhost:8080")

			if !tt.wantErr {
				mockRepo.On("Create", mock.Anything, mock.AnythingOfType("*entity.Poll")).
					Return(nil).
					Run(func(args mock.Arguments) {
						p := args.Get(1).(*entity.Poll)
						// Simulate GORM BeforeCreate hook
						if p.ID == uuid.Nil {
							p.ID = uuid.New()
						}
						assert.Equal(t, tt.input.Title, p.Title)
						assert.Equal(t, tt.input.Description, p.Description)
						assert.Equal(t, len(tt.input.Options), len(p.Options))
						assert.Equal(t, tt.input.MultiChoice, p.MultiChoice)
						assert.Equal(t, tt.input.RequireAuth, p.RequireAuth)
						
						if tt.input.ExpiresIn != nil {
							assert.NotNil(t, p.ExpiresAt)
							assert.True(t, p.ExpiresAt.After(time.Now()))
						}
					})
			}

			output, err := useCase.Execute(context.Background(), tt.input)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Equal(t, tt.errMsg, err.Error())
				assert.Nil(t, output)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, output)
				assert.NotEmpty(t, output.ID)
				assert.Contains(t, output.ShareURL, "http://localhost:8080/poll/")
				assert.Contains(t, output.QRCodeURL, "http://localhost:8080/api/v1/polls/")
			}

			mockRepo.AssertExpectations(t)
		})
	}
}

func intPtr(i int) *int {
	return &i
}