import {
  Profile,
  DashboardStats,
  ProfileReport,
  PromptDefinition,
  Interest,
  Activity,
  WaitlistCity,
  PaginationState,
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
  page?: number
  per_page?: number
}

export async function fetchProfiles(filters: ProfileFilters = {}): Promise<ProfilesResponse> {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.status) params.set('status', filters.status)
  if (filters.gender) params.set('gender', filters.gender)
  if (filters.city) params.set('city', filters.city)
  if (filters.page) params.set('page', filters.page.toString())
  if (filters.per_page) params.set('per_page', filters.per_page.toString())

  const queryString = params.toString()
  return fetchAPI<ProfilesResponse>(`/api/profiles${queryString ? `?${queryString}` : ''}`)
}

export async function fetchProfile(id: string): Promise<Profile> {
  return fetchAPI<Profile>(`/api/profiles/${id}`)
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
