// Population data for US cities (US Census 2020)
// This provides instant lookups without API calls

const CITY_POPULATIONS: Record<string, number> = {
  "New York": 8_336_817,
  "Salt Lake City": 199_723,
  "Washington DC": 689_545,
  "Los Angeles": 3_979_576,
  "Chicago": 2_746_388,
  "Houston": 2_304_580,
  "Phoenix": 1_608_139,
  "Philadelphia": 1_603_797,
  "San Antonio": 1_547_253,
  "San Diego": 1_423_851,
  "Dallas": 1_304_379,
  "San Jose": 1_013_240,
  "Austin": 961_855,
  "Jacksonville": 911_507,
  "Fort Worth": 909_585,
  "Columbus": 905_748,
  "Indianapolis": 887_642,
  "Charlotte": 874_579,
  "San Francisco": 873_965,
  "Seattle": 737_015,
  "Denver": 727_211,
  "Washington": 689_545,
  "Boston": 675_647,
  "El Paso": 678_815,
  "Nashville": 689_447,
  "Detroit": 639_111,
  "Portland": 652_503,
  "Memphis": 633_104,
  "Oklahoma City": 681_054,
  "Las Vegas": 641_903,
  "Louisville": 633_045,
  "Baltimore": 585_708,
  "Milwaukee": 577_222,
  "Albuquerque": 564_559,
  "Tucson": 542_629,
  "Fresno": 542_107,
  "Sacramento": 524_943,
  "Kansas City": 508_090,
  "Mesa": 504_258,
  "Atlanta": 498_715,
  "Omaha": 486_051,
  "Colorado Springs": 478_961,
  "Raleigh": 467_665,
  "Miami": 442_241,
  "Long Beach": 466_742,
  "Virginia Beach": 459_470,
  "Oakland": 433_031,
  "Minneapolis": 429_954,
  "Tampa": 384_959,
  "Tulsa": 413_066,
  "Arlington": 394_266,
  "New Orleans": 383_997,
  "Wichita": 397_532,
  "Cleveland": 372_624,
  "Bakersfield": 403_455,
  "Aurora": 386_261,
  "Anaheim": 350_365,
  "Honolulu": 350_964,
  "Santa Ana": 310_227,
  "Riverside": 314_998,
  "Corpus Christi": 317_863,
  "Lexington": 322_570,
  "Henderson": 320_189,
  "Stockton": 320_804,
  "Saint Paul": 311_527,
  "Cincinnati": 309_317,
  "St. Louis": 301_578,
  "Pittsburgh": 302_971,
  "Greensboro": 299_035,
  "Lincoln": 291_082,
  "Anchorage": 291_247,
  "Plano": 285_494,
  "Orlando": 307_573,
  "Irvine": 307_670,
  "Newark": 311_549,
  "Durham": 283_506,
  "Chula Vista": 275_487,
  "Toledo": 270_871,
  "Fort Wayne": 263_886,
  "St. Petersburg": 258_308,
  "Laredo": 255_205,
  "Jersey City": 292_449,
  "Chandler": 275_987,
  "Madison": 269_840,
  "Lubbock": 264_362,
  "Scottsdale": 241_361,
  "Reno": 264_165,
  "Buffalo": 278_349,
  "Gilbert": 267_918,
  "Glendale": 248_325,
  "North Las Vegas": 262_527,
  "Winston-Salem": 249_545,
  "Chesapeake": 249_422,
  "Norfolk": 238_005,
  "Fremont": 230_504,
  "Garland": 239_928,
  "Irving": 256_684,
  "Hialeah": 223_109,
  "Richmond": 226_610,
  "Boise": 235_684,
  "Spokane": 228_989,
  "Baton Rouge": 227_470,
}

/**
 * Get population for a city by name
 */
export function getCityPopulation(cityName: string): number | null {
  return CITY_POPULATIONS[cityName] || null
}

/**
 * Get populations for multiple cities
 */
export async function fetchCityPopulations(
  cities: Array<{
    id: string
    name: string
    state: string
    latitude: number
    longitude: number
  }>
): Promise<Map<string, number>> {
  const results = new Map<string, number>()

  for (const city of cities) {
    const population = CITY_POPULATIONS[city.name]
    if (population) {
      results.set(city.id, population)
    }
  }

  return results
}
