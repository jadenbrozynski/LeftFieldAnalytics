export interface User {
  id: string
  phone: string
  email: string | null
  is_admin: boolean
  is_banned: boolean
  created_at: string
  last_seen_at: string | null
  referral_code: string | null
}

export interface Profile {
  id: string
  user_id: string
  status: 'waitlisted' | 'live' | 'banned' | 'deleted' | 'pending_delete'
  // Note: Database stores 'non_binary' but we normalize to 'nonbinary' in the frontend
  gender: 'man' | 'woman' | 'nonbinary'
  first_name: string
  last_name: string
  age: number
  height: number | null
  birthday: string
  pronouns: string | null
  neighborhood: string | null
  bio: string | null
  school: string | null
  job_title: string | null
  hometown: string | null
  waitlist_city_id: string | null
  completed: boolean
  needs_manual_review: boolean
  created_at: string
  updated_at: string
  delete_at?: string | null
  uploads: ProfileUpload[]
  prompt_responses: PromptResponse[]
  interests: Interest[]
  activities: Activity[]
  movies: Movie[]
  books: Book[]
  songs: Song[]
  places: Place[]
  geolocation: ProfileGeolocation | null
  user: User
  // Optional: populated in waitlist responses
  waitlist_city?: { name: string; state: string | null } | null
}

export interface ProfileUpload {
  id: string
  url: string
  display_order: number
  type: 'photo' | 'video'
}

export interface ProfileGeolocation {
  id: string
  profile_id: string
  city: string | null
  region: string | null
  country: string | null
}

export interface PromptDefinition {
  id: string
  prompt: string
  category: string | null
  start_date: string | null
  end_date: string | null
  deleted_at: string | null
  created_at: string
  response_count?: number
}

export interface PromptResponse {
  id: string
  profile_id: string
  prompt_definition_id: string
  answer: string
  display_order: number
  prompt: PromptDefinition
}

export interface Interest {
  id: string
  name: string
  category: string | null
  usage_count?: number
}

export interface Activity {
  id: string
  name: string
  url: string
  usage_count?: number
}

export interface Movie {
  id: string
  imdb_id: string
  primary_title: string
  original_title: string
  primary_image: string | null
  genres: string[] | null
}

export interface Book {
  id: string
  google_books_id: string
  title: string
  authors: string[]
  thumbnail: string
}

export interface SpotifyArtist {
  name: string
  [key: string]: unknown
}

export interface Song {
  id: string
  spotify_track_id: string
  name: string
  artists: (string | SpotifyArtist)[]
  album: { name?: string; images?: { url: string }[] } | null
}

export interface Place {
  id: string
  google_places_id: string
  display_name: { text?: string } | null
  primary_type_display_name: { text?: string } | null
  short_formatted_address: string | null
}

export interface ProfileReport {
  id: string
  profile_id: string | null
  reported_profile_id: string
  reporter_notes: string | null
  reviewer_notes: string | null
  is_resolved: boolean
  profile_upload_id: string | null
  conversation_id: string | null
  created_at: string
  reporter: Profile | null
  reported: Profile
  reported_upload?: ProfileUpload | null
}

export interface ProfileTabReport {
  id: string
  reporter_notes: string | null
  is_resolved: boolean
  created_at: string
  reporter_name: string | null
  internally_flagged: boolean
}

export interface ProfileTabMatch {
  id: string
  matched_profile_id: string
  matched_profile_name: string
  matched_profile_photo: string | null
  unmatched: boolean
  unmatched_by_this_profile: boolean
  created_at: string
  message_count: number
}

export interface WaitlistCity {
  id: string
  name: string
  state: string
  latitude: number
  longitude: number
}

export interface ProfileChange {
  id: string
  profile_id: string
  field: string
  old_value: string | null
  new_value: string | null
  changed_by: string | null
  changed_at: string
  profile?: Profile
}

export interface DashboardStats {
  total_users: number
  live_profiles: number
  waitlisted_profiles: number
  pending_reports: number
  new_users_today: number
  new_users_week: number
}

export interface FilterOptions {
  search?: string
  status?: string
  gender?: string
  city?: string
  age_min?: number
  age_max?: number
  is_resolved?: boolean
  date_from?: string
  date_to?: string
}

export interface PaginationState {
  page: number
  per_page: number
  total: number
  total_pages: number
}

export interface MatchDrop {
  id: string
  number: number
  start_date: string
  end_date: string
  created_at: string
}

export interface MatchDropStats {
  id: string
  match_drop_id: string
  total_participants: number
  total_candidates_shown: number
  avg_candidates_per_participant: number
  total_match_requests: number
  total_match_rejections: number
  total_conversations: number
  match_rate: number
  total_unmatches: number
  unmatch_rate: number
  unique_request_senders: number
  total_accounts_deleted: number
  // Gender breakdown
  men_participants: number
  women_participants: number
  nonbinary_participants: number
  men_avg_candidates_shown: number
  women_avg_candidates_shown: number
  nonbinary_avg_candidates_shown: number
  men_avg_requests_sent: number
  women_avg_requests_sent: number
  nonbinary_avg_requests_sent: number
  men_avg_requests_received: number
  women_avg_requests_received: number
  nonbinary_avg_requests_received: number
  // Optional newer fields
  unique_match_participants?: number
  like_match_ratio?: number
  active_user_match_rate?: number
}

export interface DropWithStats extends MatchDrop {
  stats: MatchDropStats | null
}

export interface DropMatchProfile {
  id: string
  first_name: string
  last_name: string
  gender: string
  age: number
  status: string
  photo_url: string | null
}

export interface DropMatch {
  id: string
  created_at: string
  updated_at: string
  status: 'active' | 'unmatched'
  unmatched_by: 'profile1' | 'profile2' | null
  unmatched_at: string | null
  profile1: DropMatchProfile
  profile2: DropMatchProfile
  conversation: {
    id: string
    message_count: number
    last_message_at: string | null
  } | null
}

export interface DropMatchRequest {
  id: string
  message: string | null
  kind: string | null
  status: string | null
  created_at: string
  updated_at: string
  sender: DropMatchProfile
  receiver: DropMatchProfile
}

export interface ConversationMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_liked: boolean
  created_at: string
}

export interface ConversationDetail {
  id: string
  match_id: string
  created_at: string
  updated_at: string
  status: 'active' | 'unmatched'
  unmatched_at: string | null
  profile1: {
    id: string
    first_name: string
    last_name: string
    gender: string
    age: number
    photo_url: string | null
    last_seen_at: string | null
  }
  profile2: {
    id: string
    first_name: string
    last_name: string
    gender: string
    age: number
    photo_url: string | null
    last_seen_at: string | null
  }
  messages: ConversationMessage[]
}

// Messaging Analytics Types
export interface ConversationLogEntry {
  conversation_id: string
  message_count: number
  last_message_at: string
  last_message_content: string
  last_message_sender_id: string
  profile1: {
    id: string
    first_name: string
    last_name: string
    photo_url: string | null
  }
  profile2: {
    id: string
    first_name: string
    last_name: string
    photo_url: string | null
  }
  status: 'active' | 'unmatched'
  contact_exchanged: boolean
  has_potential_plans: boolean
}

export interface MessagingStats {
  total_messages: number
  messages_today: number
  messages_this_week: number
  active_conversations: number
  avg_messages_per_conversation: number
  matches_with_messages_pct: number
  first_message_reply_rate: number
  avg_response_time_hours: number
  liked_messages_count: number
  liked_messages_rate: number
  contact_exchange_count: number
  contact_exchange_rate: number
  conversations_by_message_count: {
    zero: number
    one_to_four: number
    five_plus: number
  }
  unmatched_count: number
  unmatch_rate: number
  // New metrics
  double_text_conversations: number
  double_text_rate: number
  avg_message_length: number
  avg_time_to_first_message_hours: number
  ghosted_conversations: number
  ghost_rate: number
  first_message_by_gender: {
    women: number
    men: number
    nonbinary: number
  }
  unread_conversations: number
  // Plan detection
  conversations_with_plans: number
  plans_rate: number
  // New metrics - engagement quality
  mutual_messaging_rate: number
  mutual_messaging_count: number
  block_rate: number
  blocked_conversations: number
  // Overlaps impact
  avg_messages_with_overlaps: number
  avg_messages_without_overlaps: number
  // Match request metrics
  request_acceptance_rate: number
  accepted_requests: number
  total_requests: number
  message_with_request_rate: number
  requests_with_message: number
  // Standout conversion
  standout_conversion_rate: number
  standouts_converted: number
  total_standouts: number
  // Rejection by gender
  rejection_by_gender: {
    women: number
    men: number
    nonbinary: number
  }
  // Notification delivery
  notification_delivery_rate: number
  notifications_delivered: number
  total_notifications: number
}

export interface MessagingTrend {
  date: string
  messages: number
  active_conversations: number
}

export interface MessagesByGender {
  women: number
  men: number
  nonbinary: number
}

export interface ResponseByHour {
  hour: number
  message_count: number
  percentage: number
}

// =====================
// Analytics Dashboard Types
// =====================

// User Growth & Retention
export interface UserGrowthStats {
  total_users: number
  new_this_week: number
  new_this_month: number
  d1_retention: number
  d7_retention: number
  d30_retention: number
  d90_retention: number
  churn_rate_7d: number
  churn_rate_30d: number
  avg_user_lifetime_days: number
  status_breakdown: {
    live: number
    waitlisted: number
    banned: number
    deleted: number
  }
}

export interface RegistrationTrend {
  date: string
  registrations: number
  cumulative: number
}

export interface RetentionCohort {
  cohort_date: string
  cohort_size: number
  d1_pct: number | null
  d7_pct: number | null
  d30_pct: number | null
  d90_pct: number | null
}

// Activation Funnel
export interface ActivationFunnelStats {
  signups: number
  profiles_created: number
  profiles_completed: number
  with_match: number
  with_message: number
  conversion_rates: {
    signup_to_profile: number
    profile_to_complete: number
    complete_to_match: number
    match_to_message: number
    overall: number
  }
  avg_time_to_profile_hours: number
  avg_time_to_complete_hours: number
  avg_time_to_match_hours: number
  avg_time_to_message_hours: number
}

export interface FunnelTrend {
  date: string
  signups: number
  completed: number
  with_match: number
  with_message: number
}

// Referral Analytics
export interface ReferralStats {
  total_referrals: number
  unique_referrers: number
  conversion_rate: number
  referral_vs_organic: {
    referral_retention_7d: number
    organic_retention_7d: number
    referral_match_rate: number
    organic_match_rate: number
  }
}

export interface ReferralCodeStats {
  code: string
  uses: number
  conversions: number
  conversion_rate: number
}

export interface ReferralTrend {
  date: string
  referrals: number
  organic: number
}

// Profile Quality
export interface ProfileQualityStats {
  avg_completeness_score: number
  photo_metrics: {
    avg_photos: number
    pct_with_6_photos: number
  }
  bio_metrics: {
    avg_length: number
    pct_with_bio: number
  }
  field_completion: {
    bio: number
    school: number
    job_title: number
    hometown: number
    neighborhood: number
    height: number
  }
  by_gender: {
    women: number
    men: number
    nonbinary: number
  }
}

export interface QualityDistribution {
  bucket: string
  count: number
  percentage: number
}

export interface QualityImpactMetric {
  quality_tier: 'high' | 'medium' | 'low'
  avg_matches: number
  avg_messages: number
  profile_count: number
}
