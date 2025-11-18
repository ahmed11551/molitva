export interface Friend {
  id: string;
  user_id: string;
  friend_user_id: string;
  status: "pending" | "accepted" | "blocked";
  created_at: string;
  updated_at: string;
}

export interface FriendRequest {
  from_user_id: string;
  to_user_id: string;
  message?: string;
}

export interface FriendStats {
  friend_user_id: string;
  friend_name?: string;
  total_completed: number;
  total_debt: number;
  progress_percent: number;
  rank?: number;
}

export interface LeaderboardEntry {
  user_id: string;
  user_name?: string;
  total_completed: number;
  total_debt: number;
  progress_percent: number;
  rank: number;
}

