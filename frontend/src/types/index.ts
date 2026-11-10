export interface InstagramProfile {
  id: string;
  username: string;
  full_name: string;
  profile_pic_url: string;
  follower_count: number;
  following_count: number;
  last_synced_text?: string;
  is_encrypted?: boolean;
}

export interface AntiBanInfo {
  used_today: number;
  quota_limit: number;
  remaining_quota: number;
  status_text?: string;
  speed_status?: string;
  status?: string;
}

export interface RelationAnalysis {
  tidak_follback_count: number;
  unfollowers_baru: {
    count: number;
    badge: string;
  };
  followers_baru: {
    count: number;
    badge: string;
  };
  mutuals: {
    count: number;
    badge: string;
  };
  belum_difollow: {
    count: number;
    badge: string;
  };
}

export interface HomeDashboardResponse {
  profile: InstagramProfile;
  anti_ban: AntiBanInfo;
  relation_analysis: RelationAnalysis;
}

export type UnfollowButtonState = 'NORMAL' | 'COOLDOWN' | 'COMPLETED' | 'LOADING';

export interface UnfollowerItem {
  target_ig_pk: string;
  target_username: string;
  target_full_name: string;
  target_pic_url: string;
  is_whitelisted: boolean;
  instagram_url: string;
  unfollow_state: UnfollowButtonState;
}

export interface UnfollowersResponse {
  total_count: number;
  whitelisted_count: number;
  anti_ban: AntiBanInfo;
  items: UnfollowerItem[];
}

export interface ActivityItem {
  id: string;
  event_type: 'UNFOLLOWED_YOU' | 'NEW_FOLLOWER' | 'YOU_UNFOLLOWED';
  tag_label: string;
  tag_color: 'red' | 'green';
  target_username: string;
  target_full_name: string;
  target_pic_url: string;
  timestamp_wib: string;
  instagram_url: string;
}

export interface ActivityGroup {
  date_title: string;
  activity_count: number;
  items: ActivityItem[];
}

export interface ActivitiesResponse {
  highlights: {
    unfollowed_today: number;
    new_followers_today: number;
  };
  groups: ActivityGroup[];
}

export interface AccountSwitcherItem {
  id: string;
  username: string;
  full_name: string;
  profile_pic_url: string;
  follower_count: number;
  following_count: number;
  is_active: boolean;
}
