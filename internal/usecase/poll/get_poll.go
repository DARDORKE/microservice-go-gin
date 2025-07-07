package poll

import (
	"context"

	"github.com/google/uuid"
	"microservice-go-gin/internal/domain/entity"
	"microservice-go-gin/internal/domain/repository"
)

type GetPollUseCase struct {
	pollRepo repository.PollRepository
	voteRepo repository.VoteRepository
}

func NewGetPollUseCase(pollRepo repository.PollRepository, voteRepo repository.VoteRepository) *GetPollUseCase {
	return &GetPollUseCase{
		pollRepo: pollRepo,
		voteRepo: voteRepo,
	}
}

func (uc *GetPollUseCase) Execute(ctx context.Context, pollID uuid.UUID) (*entity.Poll, error) {
	poll, err := uc.pollRepo.GetByIDWithResults(ctx, pollID)
	if err != nil {
		return nil, err
	}

	return poll, nil
}