package poll

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"microservice-go-gin/internal/domain/entity"
	"microservice-go-gin/internal/domain/repository"
)

type CreatePollInput struct {
	Title       string    `json:"title" binding:"required,min=3,max=255"`
	Description string    `json:"description" binding:"max=500"`
	Options     []string  `json:"options" binding:"required,min=2,max=10,dive,required,min=1,max=255"`
	MultiChoice bool      `json:"multi_choice"`
	RequireAuth bool      `json:"require_auth"`
	ExpiresIn   *int      `json:"expires_in"`
	CreatedBy   string    `json:"-"`
}

type CreatePollOutput struct {
	ID        uuid.UUID `json:"id"`
	ShareURL  string    `json:"share_url"`
	QRCodeURL string    `json:"qr_code_url"`
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