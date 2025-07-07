package poll

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"microservice-go-gin/internal/domain/entity"
	"microservice-go-gin/internal/domain/repository"
)

// CreatePollInput represents the input for creating a new poll
type CreatePollInput struct {
	Title       string   `json:"title" binding:"required,min=3,max=255" example:"What's your favorite programming language?"`
	Description string   `json:"description" binding:"max=500" example:"Choose your preferred programming language"`
	Options     []string `json:"options" binding:"required,min=2,max=10,dive,required,min=1,max=255" example:"Go,Python,JavaScript,Rust"`
	MultiChoice bool     `json:"multi_choice" example:"false"`
	RequireAuth bool     `json:"require_auth" example:"false"`
	ExpiresIn   *int     `json:"expires_in" example:"60"`
	CreatedBy   string   `json:"-"`
}

// CreatePollOutput represents the output after creating a poll
type CreatePollOutput struct {
	ID        uuid.UUID `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	ShareURL  string    `json:"share_url" example:"http://localhost:8080/poll/550e8400-e29b-41d4-a716-446655440000"`
	QRCodeURL string    `json:"qr_code_url" example:"http://localhost:8080/api/v1/polls/550e8400-e29b-41d4-a716-446655440000/qr"`
}

type CreatePollUseCase struct {
	pollRepo repository.PollRepository
	baseURL  string
}

func NewCreatePollUseCase(pollRepo repository.PollRepository, baseURL string) *CreatePollUseCase {
	return &CreatePollUseCase{
		pollRepo: pollRepo,
		baseURL:  baseURL,
	}
}

func (uc *CreatePollUseCase) Execute(ctx context.Context, input CreatePollInput) (*CreatePollOutput, error) {
	if len(input.Options) < 2 {
		return nil, errors.New("poll must have at least 2 options")
	}

	poll := &entity.Poll{
		Title:       input.Title,
		Description: input.Description,
		MultiChoice: input.MultiChoice,
		RequireAuth: input.RequireAuth,
		CreatedBy:   input.CreatedBy,
	}

	if input.ExpiresIn != nil && *input.ExpiresIn > 0 {
		expiresAt := time.Now().Add(time.Duration(*input.ExpiresIn) * time.Minute)
		poll.ExpiresAt = &expiresAt
	}

	for i, optionText := range input.Options {
		option := entity.Option{
			Text:  optionText,
			Order: i,
		}
		poll.Options = append(poll.Options, option)
	}

	if err := uc.pollRepo.Create(ctx, poll); err != nil {
		return nil, err
	}

	output := &CreatePollOutput{
		ID:        poll.ID,
		ShareURL:  uc.baseURL + "/poll/" + poll.ID.String(),
		QRCodeURL: uc.baseURL + "/api/v1/polls/" + poll.ID.String() + "/qr",
	}

	return output, nil
}