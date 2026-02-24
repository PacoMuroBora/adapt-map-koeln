'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ProgressBar from '@/components/questionnaire/ProgressBar'
import { useSubmission } from '@/providers/Submission'
import { useDebounce } from '@/utilities/useDebounce'
import { Loader2, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useRef } from 'react'
import { STEP_LOCATION, TOTAL_STEPS } from '../../questionnaire/constants'

interface AddressSuggestion {
  name: string
  postcode: string
  city: string
  street?: string
  housenumber?: string
  lat: number
  lng: number
}

export default function LocationPage() {
  const router = useRouter()
  const { state, updateLocation, updateCurrentStep } = useSubmission()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Manual input fields
  const [street, setStreet] = useState('')
  const [housenumber, setHousenumber] = useState('')
  const [postalcode, setPostalcode] = useState('')
  const [city, setCity] = useState('')

  // Autocomplete state
  const [autocompleteQuery, setAutocompleteQuery] = useState('')
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const debouncedQuery = useDebounce(autocompleteQuery, 300)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleGPSLocation = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation wird von Ihrem Browser nicht unterstützt.')
      }

      // Check for cached position (valid for 5 minutes)
      const cachedPosition = localStorage.getItem('gps_position')
      if (cachedPosition) {
        try {
          const { position: cached, timestamp } = JSON.parse(cachedPosition)
          const age = Date.now() - timestamp
          const CACHE_VALIDITY = 5 * 60 * 1000 // 5 minutes

          if (age < CACHE_VALIDITY && cached.lat && cached.lng) {
            // Use cached position
            const response = await fetch('/api/reverse-geocode', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat: cached.lat, lng: cached.lng }),
            })

            if (response.ok) {
              const data = await response.json()
              updateLocation({
                lat: cached.lat,
                lng: cached.lng,
                postal_code: data.postal_code,
                city: data.city,
                street: data.street || undefined,
              })
              updateCurrentStep('personal')
              router.push('/personal')
              return
            }
          }
        } catch (e) {
          // Invalid cache, continue to get new position
        }
      }

      // Get new position with configurable timeout
      const GPS_TIMEOUT = 15000 // 15 seconds
      const MIN_ACCURACY = 100 // meters - accept positions within 100m accuracy

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        let timeoutId: NodeJS.Timeout

        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            // Check accuracy - if good enough, use it immediately
            if (pos.coords.accuracy <= MIN_ACCURACY) {
              clearTimeout(timeoutId)
              navigator.geolocation.clearWatch(watchId)
              resolve(pos)
              return
            }

            // If accuracy is poor but we have a position, wait a bit more
            // but don't wait forever
            if (!timeoutId) {
              timeoutId = setTimeout(() => {
                navigator.geolocation.clearWatch(watchId)
                // Accept position even if accuracy is not perfect
                resolve(pos)
              }, GPS_TIMEOUT)
            }
          },
          reject,
          {
            enableHighAccuracy: true,
            timeout: GPS_TIMEOUT,
            maximumAge: 60000, // Accept positions up to 1 minute old
          },
        )

        // Fallback timeout
        timeoutId = setTimeout(() => {
          navigator.geolocation.clearWatch(watchId)
          reject(new Error('Timeout'))
        }, GPS_TIMEOUT)
      })

      const { latitude, longitude, accuracy } = position.coords

      // Validate accuracy (warn but don't fail if accuracy is poor)
      if (accuracy > MIN_ACCURACY * 2) {
        console.warn(`GPS accuracy is ${Math.round(accuracy)}m, which may affect results`)
      }

      // Cache the position
      try {
        localStorage.setItem(
          'gps_position',
          JSON.stringify({
            position: { lat: latitude, lng: longitude },
            timestamp: Date.now(),
          }),
        )
      } catch (e) {
        // localStorage might be disabled, continue anyway
      }

      // Call reverse geocoding API
      const response = await fetch('/api/reverse-geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: latitude, lng: longitude }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 429) {
          throw new Error(
            'Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut oder verwenden Sie die manuelle Eingabe.',
          )
        }
        throw new Error(
          errorData.error ||
            'Geocodierung fehlgeschlagen. Bitte verwenden Sie die manuelle Eingabe.',
        )
      }

      const data = await response.json()

      if (!data.postal_code) {
        throw new Error(
          'Postleitzahl konnte nicht ermittelt werden. Bitte verwenden Sie die manuelle Eingabe.',
        )
      }

      updateLocation({
        lat: latitude,
        lng: longitude,
        postal_code: data.postal_code,
        city: data.city,
        street: data.street || undefined,
      })

      updateCurrentStep('personal')
      router.push('/personal')
    } catch (err: any) {
      // Clear cache on error
      try {
        localStorage.removeItem('gps_position')
      } catch (e) {
        // Ignore localStorage errors
      }

      // Handle specific geolocation error codes
      if (err.code === 1) {
        setError(
          'Standortzugriff wurde verweigert. Bitte erlauben Sie den Standortzugriff in Ihren Browsereinstellungen oder verwenden Sie die manuelle Eingabe.',
        )
      } else if (err.code === 2) {
        setError(
          'Standort konnte nicht ermittelt werden. Bitte überprüfen Sie Ihre GPS-Einstellungen oder verwenden Sie die manuelle Eingabe.',
        )
      } else if (err.code === 3 || err.message === 'Timeout') {
        setError(
          'Zeitüberschreitung bei der Standortermittlung. Bitte versuchen Sie es erneut oder verwenden Sie die manuelle Eingabe.',
        )
      } else {
        setError(
          err.message ||
            'Fehler bei der Standortermittlung. Bitte verwenden Sie die manuelle Eingabe.',
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Address autocomplete
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedQuery || debouncedQuery.length < 3) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      setIsLoadingSuggestions(true)
      try {
        const PHOTON_URL = process.env.NEXT_PUBLIC_PHOTON_URL || 'https://photon.komoot.io'
        const response = await fetch(
          `${PHOTON_URL}/api?q=${encodeURIComponent(debouncedQuery)}&limit=5&lang=de`,
          {
            headers: {
              'User-Agent': 'AdaptMapKoeln/1.0',
            },
          },
        )

        if (response.ok) {
          const data = await response.json()
          const formattedSuggestions: AddressSuggestion[] = (data.features || []).map(
            (feature: any) => {
              const [lng, lat] = feature.geometry.coordinates
              const props = feature.properties

              // Parse street and housenumber from name if available
              const nameParts = props.name?.split(' ') || []
              let streetName = props.street || props.name
              let houseNum = props.housenumber || ''

              // Try to extract housenumber from name (e.g., "Musterstraße 123")
              if (!houseNum && nameParts.length > 1) {
                const lastPart = nameParts[nameParts.length - 1]
                if (/^\d+[a-z]?$/i.test(lastPart)) {
                  houseNum = lastPart
                  streetName = nameParts.slice(0, -1).join(' ')
                }
              }

              return {
                name: props.name || props.display_name || debouncedQuery,
                postcode: props.postcode || '',
                city: props.city || props.town || props.name || '',
                street: streetName,
                housenumber: houseNum,
                lat,
                lng,
              }
            },
          )

          setSuggestions(formattedSuggestions)
          setShowSuggestions(formattedSuggestions.length > 0)
        }
      } catch (err) {
        // Silently fail - autocomplete is optional
        console.error('Autocomplete error:', err)
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setIsLoadingSuggestions(false)
      }
    }

    fetchSuggestions()
  }, [debouncedQuery])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    setStreet(suggestion.street || '')
    setHousenumber(suggestion.housenumber || '')
    setPostalcode(suggestion.postcode || '')
    setCity(suggestion.city || '')
    setAutocompleteQuery('')
    setShowSuggestions(false)
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!street || !postalcode || !city) {
        throw new Error('Bitte füllen Sie alle Pflichtfelder aus.')
      }

      // Call geocoding API
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          street,
          housenumber,
          postalcode,
          city,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Adresse konnte nicht gefunden werden.')
      }

      const data = await response.json()

      // Combine street and housenumber for the street field
      const fullStreet = housenumber ? `${street} ${housenumber}`.trim() : street

      updateLocation({
        lat: data.lat,
        lng: data.lng,
        postal_code: data.postal_code || postalcode,
        city: data.city || city,
        street: fullStreet,
        housenumber,
      })

      updateCurrentStep('personal')
      router.push('/personal')
    } catch (err: any) {
      setError(err.message || 'Fehler bei der Adresssuche. Bitte überprüfen Sie Ihre Eingabe.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
      <div className="space-y-6">
        {/* Progress bar */}
        <ProgressBar currentStep={STEP_LOCATION} totalSteps={TOTAL_STEPS} />

        <div>
          <h1 className="mb-4 text-2xl font-bold sm:text-3xl">Standort erfassen</h1>
          <p className="text-muted-foreground">
            Bitte teilen Sie uns Ihren Standort mit, damit wir Ihre Antworten geografisch zuordnen
            können.
          </p>
        </div>

        {/* GPS Button */}
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <div>
            <h2 className="mb-2 text-lg font-semibold">Standort automatisch ermitteln</h2>
            <p className="text-sm text-muted-foreground">
              Wir benötigen Ihre Erlaubnis, um Ihren Standort zu ermitteln. Ihre genauen Koordinaten
              werden nicht gespeichert, nur die Postleitzahl.
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="button"
            onClick={handleGPSLocation}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Standort wird ermittelt...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" />
                Mein Standort
              </>
            )}
          </Button>
        </div>

        {/* Manual Form */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">oder</p>
          </div>
          <form onSubmit={handleManualSubmit} className="space-y-6">
            <div className="space-y-4 rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold">Adresse eingeben</h2>
              <div className="space-y-4">
                {/* Address autocomplete */}
                <div className="relative">
                  <Label htmlFor="autocomplete">Adresse suchen (optional)</Label>
                  <div className="relative">
                    <Input
                      ref={inputRef}
                      id="autocomplete"
                      value={autocompleteQuery}
                      onChange={(e) => {
                        setAutocompleteQuery(e.target.value)
                        setShowSuggestions(true)
                      }}
                      onFocus={() => {
                        if (suggestions.length > 0) setShowSuggestions(true)
                      }}
                      placeholder="Adresse oder Ort eingeben..."
                      disabled={isLoading}
                    />
                    {isLoadingSuggestions && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg"
                    >
                      <ul className="max-h-60 overflow-auto">
                        {suggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            className="cursor-pointer px-4 py-2 hover:bg-accent"
                            onClick={() => handleSuggestionSelect(suggestion)}
                          >
                            <div className="font-medium">{suggestion.name}</div>
                            {suggestion.postcode && suggestion.city && (
                              <div className="text-sm text-muted-foreground">
                                {suggestion.postcode} {suggestion.city}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <Label htmlFor="street">Straße *</Label>
                    <Input
                      id="street"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Musterstraße"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="housenumber">Hausnummer</Label>
                    <Input
                      id="housenumber"
                      value={housenumber}
                      onChange={(e) => setHousenumber(e.target.value)}
                      placeholder="123"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="postalcode">Postleitzahl *</Label>
                    <Input
                      id="postalcode"
                      value={postalcode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 5)
                        setPostalcode(value)
                      }}
                      placeholder="50667"
                      required
                      disabled={isLoading}
                      pattern="[0-9]{5}"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Stadt *</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Köln"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto sm:ml-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird verarbeitet...
                  </>
                ) : (
                  'Weiter'
                )}
              </Button>
            </div>
          </form>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-muted-foreground underline hover:no-underline">
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  )
}
