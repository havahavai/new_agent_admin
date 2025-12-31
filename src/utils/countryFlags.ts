import { countries, getCountryByCode } from '@/data/countries'

/**
 * Get country code from country name
 */
const getCountryCodeFromName = (countryName: string): string | null => {
  if (!countryName) return null
  
  const normalized = countryName.trim()
  
  // Try exact match first
  let country = countries.find(
    c => c.name.toLowerCase() === normalized.toLowerCase()
  )
  
  // Try partial match
  if (!country) {
    country = countries.find(
      c => 
        c.name.toLowerCase().includes(normalized.toLowerCase()) ||
        normalized.toLowerCase().includes(c.name.toLowerCase())
    )
  }
  
  return country?.code || null
}

/**
 * Convert country code (ISO 3166-1 alpha-2) to flag emoji
 * Uses regional indicator symbols to create flag emojis
 */
const countryCodeToFlag = (code: string): string => {
  if (!code || code.length !== 2) return '🏳️'
  
  try {
    const upperCode = code.toUpperCase()
    const codePoints = upperCode
      .split('')
      .map(char => 127397 + char.charCodeAt(0))
    
    const flag = String.fromCodePoint(...codePoints)
    // Verify it's a valid flag emoji (should be 2 characters)
    if (flag.length >= 2) {
      return flag
    }
    return '🏳️'
  } catch (error) {
    console.error('Error generating flag emoji:', error)
    return '🏳️'
  }
}

/**
 * Get flag emoji from country name
 * @param countryName - Country name (e.g., "India", "Thailand") or country code (e.g., "IN", "TH")
 * @returns Flag emoji (e.g., "🇮🇳", "🇹🇭")
 */
export const getCountryFlag = (countryName: string): string => {
  if (!countryName) return '🏳️'
  
  // If it's already a 2-letter code, use it directly
  if (countryName.length === 2 && /^[A-Z]{2}$/i.test(countryName)) {
    return countryCodeToFlag(countryName.toUpperCase())
  }
  
  // Otherwise, try to find the country code from the name
  const code = getCountryCodeFromName(countryName)
  if (!code) {
    console.warn('Could not find country code for:', countryName)
    return '🏳️'
  }
  
  return countryCodeToFlag(code)
}

