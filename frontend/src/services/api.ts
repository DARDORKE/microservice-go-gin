import axios from 'axios';
import { Poll, CreatePollRequest, VoteRequest } from '../types/poll';

const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const pollService = {
  createPoll: async (pollData: CreatePollRequest): Promise<Poll> => {
    const response = await api.post('/polls', pollData);
    return response.data;
  },

  getPoll: async (pollId: string): Promise<Poll> => {
    const response = await api.get(`/polls/${pollId}`);
    return response.data;
  },

  vote: async (pollId: string, voteData: VoteRequest): Promise<void> => {
    await api.post(`/polls/${pollId}/vote`, voteData);
  },

  getQRCode: (pollId: string): string => {
    return `/api/v1/polls/${pollId}/qr`;
  },
};

export default api;