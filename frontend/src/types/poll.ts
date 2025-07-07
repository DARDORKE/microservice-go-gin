export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  created_at: string;
  expires_at?: string;
  total_votes: number;
  is_active: boolean;
}

export interface CreatePollRequest {
  title: string;
  description: string;
  options: string[];
  expires_at?: string;
}

export interface VoteRequest {
  option_id: string;
}

export interface WebSocketMessage {
  type: string;
  poll_id: string;
  option_id?: string;
  votes?: number;
  total_votes?: number;
}