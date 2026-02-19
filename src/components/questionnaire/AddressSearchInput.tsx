'use client'

import { ChevronDown, Loader2 } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { useDebounce } from '@/utilities/useDebounce'
import { cn } from '@/utilities/ui'

export interface AddressSuggestion {
  name: string
  displayName: string // street + housenumber for display
  postcode: string
  city: string
  street?: string
  housenumber?: string
  lat: number
  lng: number
}

export interface AddressSearchInputProps {
  value: { street: string; postal_code?: string }
  onChange: (value: { street: string; postal_code?: string }) => void
  onError?: (error: string | null) => void
  placeholder?: string
  disabled?: boolean
  /** PLZ to filter suggestions to addresses within Cologne (e.g. from previous step) */
  postalCode?: string | null
}

const PHOTON_URL = process.env.NEXT_PUBLIC_PHOTON_URL || 'https://photon.komoot.io'

// Cologne center for biasing Photon results
const COLOGNE_LAT = 50.9375
const COLOGNE_LON = 6.9603

export function AddressSearchInput({
  value,
  onChange,
  onError,
  placeholder = 'STRASSE SUCHEN',
  disabled = false,
  postalCode,
}: AddressSearchInputProps) {
  const [query, setQuery] = useState(value.street || '')
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [houseNumberMode, setHouseNumberMode] = useState<string | null>(null)
  const debouncedQuery = useDebounce(query, 150)
  const containerRef = useRef<HTMLDivElement>(null)
  const justSelectedRef = useRef(false)
  const houseNumbersCacheRef = useRef<Map<string, AddressSuggestion[]>>(new Map())

  // Parse "Mozartstraße 1" → { street: "Mozartstraße", numberPrefix: "1" }
  const parsedStreetNumber = React.useMemo(() => {
    const m = debouncedQuery.trim().match(/^(.+?)\s+(\d+[a-z]?)$/i)
    return m ? { street: m[1].trim(), numberPrefix: m[2].toLowerCase() } : null
  }, [debouncedQuery])

  const isHouseNumberMode =
    houseNumberMode != null ||
    (parsedStreetNumber != null && parsedStreetNumber.street.length >= 2)

  useEffect(() => {
    // House number mode: "Mozartstraße 1" or after selecting "Mozartstraße"
    const street = houseNumberMode ?? parsedStreetNumber?.street
    const numberPrefix = parsedStreetNumber?.numberPrefix ?? ''

    if (isHouseNumberMode && street && street.length >= 2) {
      const cacheKey = `${street.trim().toLowerCase()}|${(postalCode || '').trim()}`
      const applyFilter = (addrs: AddressSuggestion[]) => {
        if (numberPrefix) {
          return addrs.filter((s) =>
            (s.housenumber || '').toLowerCase().startsWith(numberPrefix),
          )
        }
        return addrs
      }

      const cached = houseNumbersCacheRef.current.get(cacheKey)
      if (cached) {
        const filtered = applyFilter(cached)
        setSuggestions(filtered)
        setShowSuggestions(filtered.length > 0)
        setHighlightedIndex(0)
        return
      }

      const fetchHouseNumbers = async () => {
        setIsLoading(true)
        try {
          const params = new URLSearchParams({
            street: street.trim(),
            ...(postalCode?.trim()?.length === 5 && { postcode: postalCode.trim() }),
          })
          const response = await fetch(`/api/house-numbers?${params.toString()}`)
          if (response.ok) {
            const data = await response.json()
            const formatted: AddressSuggestion[] = (data.addresses || []).map(
              (a: { street: string; housenumber: string; postcode: string; city: string; lat: number; lng: number }) => {
                const displayName = [a.street, a.housenumber].filter(Boolean).join(' ').trim()
                return {
                  name: displayName,
                  displayName,
                  postcode: a.postcode,
                  city: a.city,
                  street: a.street,
                  housenumber: a.housenumber,
                  lat: a.lat,
                  lng: a.lng,
                }
              },
            )
            houseNumbersCacheRef.current.set(cacheKey, formatted)
            const filtered = applyFilter(formatted)
            setSuggestions(filtered)
            setShowSuggestions(filtered.length > 0)
            setHighlightedIndex(0)
          } else {
            setSuggestions([])
          }
        } catch {
          setSuggestions([])
        } finally {
          setIsLoading(false)
        }
      }
      fetchHouseNumbers()
      return
    }

    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const fetchSuggestions = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          q: debouncedQuery,
          limit: '40',
          lang: 'de',
          lat: String(COLOGNE_LAT),
          lon: String(COLOGNE_LON),
          bbox: '6.75,50.85,7.15,51.05',
        })
        const response = await fetch(`${PHOTON_URL}/api?${params.toString()}`, {
          headers: { 'User-Agent': 'AdaptMapKoeln/1.0' },
        })
        if (response.ok) {
          const data = await response.json()
          const EXCLUDED_OSM_KEYS = ['shop', 'amenity', 'tourism', 'leisure', 'craft']

          let formatted: AddressSuggestion[] = (data.features || [])
            .filter((feature: any) => {
              const props = feature.properties
              const osmKey = props?.osm_key
              const featType = props?.type
              if (osmKey && EXCLUDED_OSM_KEYS.includes(osmKey)) return false
              if (featType === 'city') return false
              return props?.street || props?.name || props?.housenumber
            })
            .map((feature: any) => {
              const [lng, lat] = feature.geometry.coordinates
              const props = feature.properties
              const nameParts = props.name?.split(' ') || []
              let streetName = props.street || props.name
              let houseNum = props.housenumber || ''
              if (!houseNum && nameParts.length > 1) {
                const lastPart = nameParts[nameParts.length - 1]
                if (/^\d+[a-z]?$/i.test(lastPart)) {
                  houseNum = lastPart
                  streetName = nameParts.slice(0, -1).join(' ')
                }
              }
              const displayName =
                [streetName, houseNum].filter(Boolean).join(' ').trim() ||
                props.name ||
                debouncedQuery
              return {
                name: props.name || props.display_name || debouncedQuery,
                displayName,
                postcode: props.postcode || '',
                city: props.city || props.town || props.name || '',
                street: streetName,
                housenumber: houseNum,
                lat,
                lng,
              }
            })
          const targetPlz = postalCode?.trim()
          const isCologne = (s: AddressSuggestion) =>
            s.city?.toLowerCase().includes('köln') || s.city?.toLowerCase().includes('cologne')
          if (targetPlz && targetPlz.length === 5) {
            formatted = formatted.filter((s) => s.postcode === targetPlz && isCologne(s))
          } else {
            formatted = formatted.filter(isCologne)
          }
          const seen = new Set<string>()
          formatted = formatted.filter((s) => {
            const key = `${s.displayName}|${s.postcode}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
          setSuggestions(formatted)
          setShowSuggestions(formatted.length > 0)
          setHighlightedIndex(0)
        }
      } catch {
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSuggestions()
  }, [debouncedQuery, houseNumberMode, isHouseNumberMode, parsedStreetNumber, postalCode])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
        setHouseNumberMode(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false
      return
    }
    setQuery(value.street || '')
  }, [value.street])

  const handleSelect = (suggestion: AddressSuggestion, e?: React.MouseEvent) => {
    e?.preventDefault()
    const displayValue =
      [suggestion.street, suggestion.housenumber].filter(Boolean).join(' ').trim() ||
      suggestion.name
    const hasHouseNumber = Boolean(suggestion.housenumber?.trim())

    justSelectedRef.current = true
    setQuery(displayValue)
    onChange({
      street: displayValue,
      postal_code: suggestion.postcode || undefined,
    })

    if (hasHouseNumber) {
      setShowSuggestions(false)
      setHouseNumberMode(null)
    } else {
      setHouseNumberMode(suggestion.street?.trim() || displayValue)
      setShowSuggestions(true)
    }
    onError?.(null)
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          'relative overflow-hidden border border-am-purple-alt bg-white',
          showSuggestions && suggestions.length > 0 ? 'rounded-2xl' : 'rounded-full',
        )}
      >
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              const v = e.target.value
              setQuery(v)
              // Only clear houseNumberMode when user changes the street part (not when appending digits)
              if (houseNumberMode && !v.startsWith(houseNumberMode)) {
                setHouseNumberMode(null)
              }
              setShowSuggestions(true)
              onError?.(null)
              onChange({
                street: v,
                postal_code: v ? value.postal_code : undefined,
              })
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true)
              else if (
                query.trim().length >= 2 &&
                !houseNumberMode &&
                !parsedStreetNumber
              ) {
                setHouseNumberMode(query.trim())
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'flex w-full bg-transparent mx-2 px-3 py-3 pr-10',
              'font-body text-body-lg font-normal text-foreground uppercase',
              'placeholder:uppercase placeholder:text-muted-foreground',
              'focus-visible:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
              !(showSuggestions && suggestions.length > 0) && 'focus-visible:border-none',
            )}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </span>
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <>
            <div className="border-t border-border mx-2" />
            <ul
              className="max-h-60 overflow-y-auto overflow-x-hidden py-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none] overscroll-contain"
              role="listbox"
              onMouseLeave={() => setHighlightedIndex(-1)}
            >
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  role="option"
                  className={cn(
                    'cursor-pointer px-3 py-1.5 mx-2 transition-colors',
                    'flex flex-col gap-0.5',
                    i === highlightedIndex && 'bg-am-green-alt rounded-full',
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleSelect(s, e)
                  }}
                  onMouseEnter={() => setHighlightedIndex(i)}
                >
                  <div className="text-body font-normal text-foreground">{s.displayName}</div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
