import axios from 'axios';
import { Poll, CreatePollRequest, VoteRequest } from '../types/poll';
import config from '../config/environment';

const API_BASE_URL = `${config.apiBaseUrl}/api/v1`;

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

  hasVoted: async (pollId: string): Promise<boolean> => {
    const response = await api.get(`/polls/${pollId}/has-voted`);
    return response.data.has_voted;
  },

  getQRCode: (pollId: string): string => {
    return `${config.apiBaseUrl}/api/v1/polls/${pollId}/qr`;
  },
};

export default api;