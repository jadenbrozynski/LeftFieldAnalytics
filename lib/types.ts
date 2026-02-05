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
  status: 'waitlisted' | 'live' | 'banned' | 'deleted'
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
  uploads: ProfileUpload[]
  prompt_responses: PromptResponse[]
  interests: Interest[]
  activities: Activity[]
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
