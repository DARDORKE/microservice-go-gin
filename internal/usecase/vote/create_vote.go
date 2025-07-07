package vote

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"microservice-go-gin/internal/domain/entity"
	"microservice-go-gin/internal/domain/repository"
)

type CreateVoteInput struct {
	PollID    uuid.UUID   `json:"poll_id" binding:"required"`
	OptionIDs []uuid.UUID `json:"option_ids" binding:"required,min=1"`
	VoterID   string      `json:"-"`
	IPAddress string      `json:"-"`
	UserAgent string      `json:"-"`
}

type CreateVoteUseCase struct {
	pollRepo repository.PollRepository
	voteRepo repository.VoteRepository
}

func NewCreateVoteUseCase(pollRepo repository.PollRepository, voteRepo repository.VoteRepository) *CreateVoteUseCase {
	return &CreateVoteUseCase{
		pollRepo: pollRepo,
		voteRepo: voteRepo,
	}
}

func (uc *CreateVoteUseCase) Execute(ctx context.Context, input CreateVoteInput) error {
	poll, err := uc.pollRepo.GetByID(ctx, input.PollID)
	if err != nil {
		return errors.New("poll not found")
	}

	if poll.IsExpired() {
		return errors.New("poll has expired")
	}

	if poll.RequireAuth && input.VoterID == "" {
		return errors.New("authentication required to vote")
	}

	hasVoted, err := uc.voteRepo.HasVoted(ctx, input.PollID, input.VoterID)
	if err != nil {
		return err
	}

	if hasVoted {
		return errors.New("you have already voted in this poll")
	}

	if !poll.MultiChoice && len(input.OptionIDs) > 1 {
		return errors.New("only one option can be selected")
	}

	validOptions := make(map[uuid.UUID]bool)
	for _, option := range poll.Options {
		validOptions[option.ID] = true
	}

	for _, optionID := range input.OptionIDs {
		if !validOptions[optionID] {
			return errors.New("invalid option selected")
		}

		vote := &entity.Vote{
			PollID:    input.PollID,
			OptionID:  optionID,
			VoterID:   input.VoterID,
			IPAddress: input.IPAddress,
			UserAgent: input.UserAgent,
		}

		if err := uc.voteRepo.Create(ctx, vote); err != nil {
			return err
		}
	}

	return nil
}