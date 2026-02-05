import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { fetchCityPopulations } from '@/lib/population-service'

export const dynamic = 'force-dynamic'

interface WaitlistCityRow {
  id: string
  name: string
  state: string
  latitude: number
  longitude: number
  profile_count: string
}

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

function getStatus(penetrationRate: number | null): CityDomination['status'] {
  if (penetrationRate === null) return 'unknown'
  if (penetrationRate >= 0.1) return 'dominating'
  if (penetrationRate >= 0.05) return 'strong'
  if (penetrationRate >= 0.01) return 'growing'
  if (penetrationRate >= 0.001) return 'early'
  return 'starting'
}

export async function GET() {
  try {
    // Get waitlist counts by city with coordinates
    const cities = await query<WaitlistCityRow>(`
      SELECT
        wc.id,
        wc.name,
        wc.state,
        wc.latitude,
        wc.longitude,
        COUNT(p.id) FILTER (WHERE p.status = 'waitlisted') as profile_count
      FROM waitlist_cities wc
      LEFT JOIN profiles p ON wc.id = p.waitlist_city_id
      GROUP BY wc.id, wc.name, wc.state, wc.latitude, wc.longitude
      ORDER BY wc.name ASC
    `)

    // Fetch population data
    const populationMap = await fetchCityPopulations(
      cities.map(c => ({
        id: c.id,
        name: c.name,
        state: c.state,
        latitude: c.latitude,
        longitude: c.longitude,
      }))
    )

    // Build city domination data
    const citiesWithDomination: CityDomination[] = cities.map(city => {
      const population = populationMap.get(city.id) || null
      const waitlistCount = parseInt(city.profile_count) || 0

      const penetrationRate = population
        ? (waitlistCount / population) * 100
        : null

      return {
        id: city.id,
        name: city.name,
        state: city.state,
        population,
        waitlist_count: waitlistCount,
        penetration_rate: penetrationRate,
        status: getStatus(penetrationRate),
      }
    })
    // Sort by waitlist count descending
    .sort((a, b) => b.waitlist_count - a.waitlist_count)

    // Calculate aggregate stats
    const totalWaitlist = citiesWithDomination.reduce(
      (sum, city) => sum + city.waitlist_count,
      0
    )

    const totalMarket = citiesWithDomination.reduce(
      (sum, city) => sum + (city.population || 0),
      0
    )

    const citiesWithPenetration = citiesWithDomination.filter(c => c.penetration_rate !== null)
    const avgPenetration =
      citiesWithPenetration.length > 0
        ? citiesWithPenetration.reduce((sum, city) => sum + (city.penetration_rate || 0), 0) /
          citiesWithPenetration.length
        : 0

    // Find city with highest penetration rate
    const topCity = citiesWithPenetration.length > 0
      ? citiesWithPenetration.reduce((top, city) =>
          (city.penetration_rate || 0) > (top.penetration_rate || 0) ? city : top
        )
      : null

    const response: DominationResponse = {
      cities: citiesWithDomination,
      stats: {
        total_market: totalMarket,
        total_waitlist: totalWaitlist,
        top_city: topCity
          ? {
              name: topCity.name,
              state: topCity.state,
              penetration_rate: topCity.penetration_rate!,
            }
          : null,
        avg_penetration: avgPenetration,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('World domination API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch world domination data' },
      { status: 500 }
    )
  }
}
