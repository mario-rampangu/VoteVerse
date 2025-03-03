export interface PollOption {
  _id: string;
  text: string;
  image_url?: string;
  vote_count: number;
}

export interface Poll {
  _id: string;
  group_id?: string;
  creator_id: string;
  title: string;
  description: string;
  options: PollOption[];
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  visibility: 'public' | 'group';
  user_vote?: string;
}

export interface Comment {
  _id: string;
  text: string;
  created_at: string;
  updated_at: string;
  user: {
    _id: string;
    username: string;
  };
}

export interface WebSocketMessage {
  type: string;
  data: any;
} 