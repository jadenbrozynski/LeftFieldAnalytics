import {
  Profile,
  DashboardStats,
  ProfileReport,
  ProfileTabReport,
  ProfileTabMatch,
  PromptDefinition,
  Interest,
  Activity,
  WaitlistCity,
  PaginationState,
  DropWithStats,
  DropMatch,
  DropMatchRequest,
  ConversationDetail,
  ConversationLogEntry,
  MessagingStats,
  MessagingTrend,
  MessagesByGender,
  ResponseByHour,
  UserGrowthStats,
  RegistrationTrend,
  RetentionCohort,
  ActivationFunnelStats,
  FunnelTrend,
  ReferralStats,
  ReferralCodeStats,
  ReferralTrend,
  ProfileQualityStats,
  QualityDistribution,
  QualityImpactMetric,
} from './types'

// Base fetch function with error handling
async function fetchAPI<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP error ${response.status}`)
  }
  return response.json()
}

// Base mutation function for write operations
async function mutateAPI<T>(url: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP error ${response.status}`)
  }
  return response.json()
}

// Dashboard
export async function fetchDashboardStats(): Promise<DashboardStats> {
  return fetchAPI<DashboardStats>('/api/dashboard/stats')
}

// Profiles
export interface ProfilesResponse {
  data: Profile[]
  pagination: PaginationState
}

export interface ProfileFilters {
  search?: string
  status?: string
  gender?: string
  city?: string
  last_seen?: string
  page?: number
  per_page?: number
}

export async function fetchProfiles(filters: ProfileFilters = {}): Promise<ProfilesResponse> {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.status) params.set('status', filters.status)
  if (filters.gender) params.set('gender', filters.gender)
  if (filters.city) params.set('city', filters.city)
  if (filters.last_seen) params.set('last_seen', filters.last_seen)
  if (filters.page) params.set('page', filters.page.toString())
  if (filters.per_page) params.set('per_page', filters.per_page.toString())

  const queryString = params.toString()
  return fetchAPI<ProfilesResponse>(`/api/profiles${queryString ? `?${queryString}` : ''}`)
}

export async function fetchProfile(id: string): Promise<Profile> {
  return fetchAPI<Profile>(`/api/profiles/${id}`)
}

// Profile mutation functions
export async function deleteProfile(id: string): Promise<Profile> {
  return mutateAPI<Profile>(`/api/profiles/${id}`, 'DELETE')
}

export async function cancelProfileDeletion(id: string, restoreStatus: Profile['status']): Promise<Profile> {
  return mutateAPI<Profile>(`/api/profiles/${id}`, 'PATCH', {
    action: 'cancel_deletion',
    restore_status: restoreStatus,
  })
}

export async function updateProfileStatus(id: string, status: Profile['status']): Promise<Profile> {
  return mutateAPI<Profile>(`/api/profiles/${id}`, 'PATCH', {
    action: 'update_status',
    status,
  })
}

export interface ProfileActivityResponse {
  reports: ProfileTabReport[]
  matches: ProfileTabMatch[]
}

export async function fetchProfileActivity(id: string): Promise<ProfileActivityResponse> {
  return fetchAPI<ProfileActivityResponse>(`/api/profiles/${id}/activity`)
}

// Convenience wrappers
export async function fetchProfileReports(id: string): Promise<ProfileTabReport[]> {
  const data = await fetchProfileActivity(id)
  return data.reports
}

export async function fetchProfileMatches(id: string): Promise<ProfileTabMatch[]> {
  const data = await fetchProfileActivity(id)
  return data.matches
}

// Waitlist
export interface WaitlistStats {
  total: number
  needs_review: number
  by_gender: {
    man: number
    woman: number
    non_binary: number
  }
  top_city: {
    id: string
    name: string
    state: string
    count: number
  } | null
}

export interface WaitlistResponse {
  data: Profile[]
  stats: WaitlistStats
  pagination: PaginationState
}

export interface WaitlistFilters {
  search?: string
  gender?: string
  city?: string
  needs_review?: string
  page?: number
  per_page?: number
}

export async function fetchWaitlist(filters: WaitlistFilters = {}): Promise<WaitlistResponse> {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.gender) params.set('gender', filters.gender)
  if (filters.city) params.set('city', filters.city)
  if (filters.needs_review) params.set('needs_review', filters.needs_review)
  if (filters.page) params.set('page', filters.page.toString())
  if (filters.per_page) params.set('per_page', filters.per_page.toString())

  const queryString = params.toString()
  return fetchAPI<WaitlistResponse>(`/api/waitlist${queryString ? `?${queryString}` : ''}`)
}

// Reports
export interface ReportsStats {
  total: number
  unresolved: number
  resolved: number
  system_flagged: number
}

export interface ReportsResponse {
  data: ProfileReport[]
  stats: ReportsStats
  pagination: PaginationState
}

export interface ReportsFilters {
  search?: string
  status?: string
  type?: string
  page?: number
  per_page?: number
}

export async function fetchReports(filters: ReportsFilters = {}): Promise<ReportsResponse> {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.status) params.set('status', filters.status)
  if (filters.type) params.set('type', filters.type)
  if (filters.page) params.set('page', filters.page.toString())
  if (filters.per_page) params.set('per_page', filters.per_page.toString())

  const queryString = params.toString()
  return fetchAPI<ReportsResponse>(`/api/reports${queryString ? `?${queryString}` : ''}`)
}

export async function fetchReport(id: string): Promise<ProfileReport> {
  return fetchAPI<ProfileReport>(`/api/reports/${id}`)
}

// Prompts
export interface PromptsResponse {
  data: PromptDefinition[]
}

export async function fetchPrompts(): Promise<PromptsResponse> {
  return fetchAPI<PromptsResponse>('/api/prompts')
}

// Interests
export interface InterestsResponse {
  data: Interest[]
}

export async function fetchInterests(): Promise<InterestsResponse> {
  return fetchAPI<InterestsResponse>('/api/interests')
}

// Activities
export interface ActivitiesResponse {
  data: Activity[]
}

export async function fetchActivities(): Promise<ActivitiesResponse> {
  return fetchAPI<ActivitiesResponse>('/api/activities')
}

// Waitlist Cities
export interface WaitlistCitiesResponse {
  data: (WaitlistCity & { profile_count: number })[]
}

export async function fetchWaitlistCities(): Promise<WaitlistCitiesResponse> {
  return fetchAPI<WaitlistCitiesResponse>('/api/waitlist-cities')
}

// Recent profiles (for dashboard)
export async function fetchRecentProfiles(limit = 5): Promise<Profile[]> {
  const response = await fetchProfiles({ per_page: limit })
  return response.data
}

// Unresolved reports (for dashboard)
export async function fetchUnresolvedReports(limit = 5): Promise<ProfileReport[]> {
  const response = await fetchReports({ status: 'unresolved', per_page: limit })
  return response.data
}

// World Domination
export interface CityDomination {
  id: string
  name: string
  state: string
  population: number | null
  waitlist_count: number
  penetration_rate: number | null
  status: 'dominating' | 'strong' | 'growing' | 'early' | 'starting' | 'unknown'
}

export interface DominationStats {
  total_market: number
  total_waitlist: number
  top_city: {
    name: string
    state: string
    penetration_rate: number
  } | null
  avg_penetration: number
}

export interface DominationResponse {
  cities: CityDomination[]
  stats: DominationStats
}

export async function fetchWorldDomination(): Promise<DominationResponse> {
  return fetchAPI<DominationResponse>('/api/world-domination')
}

// City Detail
export interface CityDetail {
  id: string
  name: string
  state: string
  latitude: number
  longitude: number
  population: number | null
  waitlist_count: number
  total_signups: number
  penetration_rate: number | null
}

export interface CityDetailResponse {
  city: CityDetail
  profiles: Profile[]
  stats: {
    total: number
    waitlisted: number
    filtered_count: number
    gender_breakdown: {
      woman: number
      man: number
      nonbinary: number
    }
  }
}

export async function fetchCityDetail(id: string, search?: string): Promise<CityDetailResponse> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  const queryString = params.toString()
  return fetchAPI<CityDetailResponse>(`/api/world-domination/${id}${queryString ? `?${queryString}` : ''}`)
}

// Drops
export interface DropsResponse {
  data: DropWithStats[]
}

export async function fetchDrops(): Promise<DropsResponse> {
  return fetchAPI<DropsResponse>('/api/drops')
}

export async function fetchDrop(id: string): Promise<DropWithStats> {
  return fetchAPI<DropWithStats>(`/api/drops/${id}`)
}

export interface DropMatchesResponse {
  data: DropMatch[]
  stats: {
    total: number
    active: number
    unmatched: number
    with_messages: number
  }
}

export async function fetchDropMatches(dropId: string): Promise<DropMatchesResponse> {
  return fetchAPI<DropMatchesResponse>(`/api/drops/${dropId}/matches`)
}

export async function exportMatchProfiles(matchId: string, fileName?: string): Promise<void> {
  const response = await fetch(`/api/matches/${matchId}/export`)
  if (!response.ok) {
    throw new Error('Failed to export match profiles')
  }
  const data = await response.json()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName || `match-${matchId}-profiles.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export interface DropRequestsResponse {
  data: DropMatchRequest[]
  stats: {
    total: number
    by_status: Record<string, number>
  }
}

export async function fetchDropRequests(dropId: string): Promise<DropRequestsResponse> {
  return fetchAPI<DropRequestsResponse>(`/api/drops/${dropId}/requests`)
}

// Conversations
export async function fetchConversation(id: string): Promise<ConversationDetail> {
  return fetchAPI<ConversationDetail>(`/api/conversations/${id}`)
}

// Messages / Conversations
export interface ConversationsResponse {
  data: ConversationLogEntry[]
  pagination: PaginationState
}

export interface ConversationsFilters {
  search?: string
  page?: number
  per_page?: number
  period?: string // '7', '30', '60', 'all'
  contact_shared?: string // 'all', 'yes', 'no'
  status?: string // 'all', 'active', 'unmatched'
  has_plans?: string // 'all', 'yes', 'no'
}

export async function fetchConversations(filters: ConversationsFilters = {}): Promise<ConversationsResponse> {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.page) params.set('page', filters.page.toString())
  if (filters.per_page) params.set('per_page', filters.per_page.toString())
  if (filters.period) params.set('period', filters.period)
  if (filters.contact_shared) params.set('contact_shared', filters.contact_shared)
  if (filters.status) params.set('status', filters.status)
  if (filters.has_plans) params.set('has_plans', filters.has_plans)

  const queryString = params.toString()
  return fetchAPI<ConversationsResponse>(`/api/messages${queryString ? `?${queryString}` : ''}`)
}

export async function fetchMessagingStats(period?: string): Promise<MessagingStats> {
  const params = new URLSearchParams()
  if (period) params.set('period', period)
  const queryString = params.toString()
  return fetchAPI<MessagingStats>(`/api/messages/stats${queryString ? `?${queryString}` : ''}`)
}

export async function fetchMessagingTrends(period?: string): Promise<MessagingTrend[]> {
  const params = new URLSearchParams()
  if (period) params.set('period', period)
  const queryString = params.toString()
  return fetchAPI<MessagingTrend[]>(`/api/messages/trends${queryString ? `?${queryString}` : ''}`)
}

export async function fetchMessagesByHour(period?: string): Promise<ResponseByHour[]> {
  const params = new URLSearchParams()
  if (period) params.set('period', period)
  const queryString = params.toString()
  return fetchAPI<ResponseByHour[]>(`/api/messages/by-hour${queryString ? `?${queryString}` : ''}`)
}

export async function fetchMessagesByGender(period?: string): Promise<MessagesByGender> {
  const params = new URLSearchParams()
  if (period) params.set('period', period)
  const queryString = params.toString()
  return fetchAPI<MessagesByGender>(`/api/messages/by-gender${queryString ? `?${queryString}` : ''}`)
}

// =====================
// Analytics API Functions
// =====================

// Growth & Retention
export async function fetchGrowthStats(period?: string): Promise<UserGrowthStats> {
  const params = new URLSearchParams()
  if (period) params.set('period', period)
  const queryString = params.toString()
  return fetchAPI<UserGrowthStats>(`/api/analytics/growth/stats${queryString ? `?${queryString}` : ''}`)
}

export async function fetchRegistrationTrends(period?: string): Promise<RegistrationTrend[]> {
  const params = new URLSearchParams()
  if (period) params.set('period', period)
  const queryString = params.toString()
  return fetchAPI<RegistrationTrend[]>(`/api/analytics/growth/trends${queryString ? `?${queryString}` : ''}`)
}

export async function fetchRetentionCohorts(): Promise<RetentionCohort[]> {
  return fetchAPI<RetentionCohort[]>('/api/analytics/growth/cohorts')
}

// Activation Funnel
export async function fetchFunnelStats(period?: string): Promise<ActivationFunnelStats> {
  const params = new URLSearchParams()
  if (period) params.set('period', period)
  const queryString = params.toString()
  return fetchAPI<ActivationFunnelStats>(`/api/analytics/funnel/stats${queryString ? `?${queryString}` : ''}`)
}

export async function fetchFunnelTrends(period?: string): Promise<FunnelTrend[]> {
  const params = new URLSearchParams()
  if (period) params.set('period', period)
  const queryString = params.toString()
  return fetchAPI<FunnelTrend[]>(`/api/analytics/funnel/trends${queryString ? `?${queryString}` : ''}`)
}

// Referrals
export async function fetchReferralStats(period?: string): Promise<ReferralStats> {
  const params = new URLSearchParams()
  if (period) params.set('period', period)
  const queryString = params.toString()
  return fetchAPI<ReferralStats>(`/api/analytics/referrals/stats${queryString ? `?${queryString}` : ''}`)
}

export async function fetchTopReferralCodes(period?: string, limit = 20): Promise<ReferralCodeStats[]> {
  const params = new URLSearchParams()
  if (period) params.set('period', period)
  params.set('limit', limit.toString())
  const queryString = params.toString()
  return fetchAPI<ReferralCodeStats[]>(`/api/analytics/referrals/codes?${queryString}`)
}

export async function fetchReferralTrends(period?: string): Promise<ReferralTrend[]> {
  const params = new URLSearchParams()
  if (period) params.set('period', period)
  const queryString = params.toString()
  return fetchAPI<ReferralTrend[]>(`/api/analytics/referrals/trends${queryString ? `?${queryString}` : ''}`)
}

// Profile Quality
export async function fetchQualityStats(period?: string): Promise<ProfileQualityStats> {
  const params = new URLSearchParams()
  if (period) params.set('period', period)
  const queryString = params.toString()
  return fetchAPI<ProfileQualityStats>(`/api/analytics/quality/stats${queryString ? `?${queryString}` : ''}`)
}

export async function fetchQualityDistribution(period?: string): Promise<QualityDistribution[]> {
  const params = new URLSearchParams()
  if (period) params.set('period', period)
  const queryString = params.toString()
  return fetchAPI<QualityDistribution[]>(`/api/analytics/quality/distribution${queryString ? `?${queryString}` : ''}`)
}

export async function fetchQualityImpact(period?: string): Promise<QualityImpactMetric[]> {
  const params = new URLSearchParams()
  if (period) params.set('period', period)
  const queryString = params.toString()
  return fetchAPI<QualityImpactMetric[]>(`/api/analytics/quality/impact${queryString ? `?${queryString}` : ''}`)
}
