package poll

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"microservice-go-gin/internal/domain/entity"
	"microservice-go-gin/internal/domain/repository"
)

// CreatePollInput represents the input for creating a new poll
type CreatePollInput struct {
	Title       string   `json:"title" binding:"required,min=3,max=255" validate:"required,min=3,max=255" example:"What's your favorite programming language?"`
	Description string   `json:"description" binding:"max=500" validate:"max=500" example:"Choose your preferred programming language"`
	Options     []string `json:"options" binding:"required,min=2,max=10,dive,required,min=1,max=255" validate:"required,min=2,max=10,dive,required,min=1,max=255" example:"Go,Python,JavaScript,Rust"`
	MultiChoice bool     `json:"multi_choice" example:"false"`
	RequireAuth bool     `json:"require_auth" example:"false"`
	ExpiresIn   *int     `json:"expires_in" validate:"omitempty,min=1,max=10080" example:"60"`
	CreatedBy   string   `json:"-" validate:"max=100"`
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
	if err := uc.validateInput(input); err != nil {
		return nil, err
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

// validateInput validates the poll creation input
func (uc *CreatePollUseCase) validateInput(input CreatePollInput) error {
	var validationErrors []string

	// Validate title
	if strings.TrimSpace(input.Title) == "" {
		validationErrors = append(validationErrors, "title cannot be empty")
	}
	if len(input.Title) < 3 {
		validationErrors = append(validationErrors, "title must be at least 3 characters long")
	}
	if len(input.Title) > 255 {
		validationErrors = append(validationErrors, "title must be no more than 255 characters long")
	}

	// Validate description
	if len(input.Description) > 500 {
		validationErrors = append(validationErrors, "description must be no more than 500 characters long")
	}

	// Validate options
	if len(input.Options) < 2 {
		validationErrors = append(validationErrors, "poll must have at least 2 options")
	}
	if len(input.Options) > 10 {
		validationErrors = append(validationErrors, "poll can have at most 10 options")
	}

	// Validate each option
	for i, option := range input.Options {
		if strings.TrimSpace(option) == "" {
			validationErrors = append(validationErrors, fmt.Sprintf("option %d cannot be empty", i+1))
		}
		if len(option) > 255 {
			validationErrors = append(validationErrors, fmt.Sprintf("option %d must be no more than 255 characters long", i+1))
		}
	}

	// Check for duplicate options
	optionMap := make(map[string]bool)
	for _, option := range input.Options {
		cleanOption := strings.TrimSpace(strings.ToLower(option))
		if optionMap[cleanOption] {
			validationErrors = append(validationErrors, "duplicate options are not allowed")
			break
		}
		optionMap[cleanOption] = true
	}

	// Validate expires_in
	if input.ExpiresIn != nil {
		if *input.ExpiresIn < 1 {
			validationErrors = append(validationErrors, "expires_in must be at least 1 minute")
		}
		if *input.ExpiresIn > 10080 { // 1 week in minutes
			validationErrors = append(validationErrors, "expires_in cannot be more than 1 week (10080 minutes)")
		}
	}

	if len(validationErrors) > 0 {
		return errors.New(strings.Join(validationErrors, "; "))
	}

	return nil
}