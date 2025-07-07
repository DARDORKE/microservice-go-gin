export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  order: number;
  created_at: string;
  updated_at: string;
  vote_count: number;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  created_by: string;
  multi_choice: boolean;
  require_auth: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  options: PollOption[];
}

export interface CreatePollRequest {
  title: string;
  description: string;
  options: string[];
  expires_at?: string;
}

export interface VoteRequest {
  option_ids: string[];
}

export interface WebSocketMessage {
  type: string;
  poll_id: string;
  data: {
    option_id?: string;
    votes?: number;
    total_votes?: number;
  };
  timestamp: number;
}