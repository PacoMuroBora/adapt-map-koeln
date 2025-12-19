'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSubmission } from '@/providers/Submission'
import { Loader2, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

type LocationMethod = 'gps' | 'manual' | null

export default function LocationPage() {
  const router = useRouter()
  const { state, updateLocation, updateCurrentStep } = useSubmission()
  const [method, setMethod] = useState<LocationMethod>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Manual input fields
  const [street, setStreet] = useState('')
  const [housenumber, setHousenumber] = useState('')
  const [postalcode, setPostalcode] = useState('')
  const [city, setCity] = useState('')

  const handleGPSLocation = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation wird von Ihrem Browser nicht unterstützt.')
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          },
        )
      })

      const { latitude, longitude } = position.coords

      // Call reverse geocoding API
      const response = await fetch('/api/reverse-geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: latitude, lng: longitude }),
      })

      if (!response.ok) {
        throw new Error('Geocodierung fehlgeschlagen. Bitte verwenden Sie die manuelle Eingabe.')
      }

      const data = await response.json()

      updateLocation({
        lat: latitude,
        lng: longitude,
        postal_code: data.postal_code,
        city: data.city,
      })

      updateCurrentStep('personal')
      router.push('/personal')
    } catch (err: any) {
      if (err.code === 1) {
        setError('Standortzugriff wurde verweigert. Bitte verwenden Sie die manuelle Eingabe.')
      } else if (err.code === 2) {
        setError('Standort konnte nicht ermittelt werden. Bitte verwenden Sie die manuelle Eingabe.')
      } else if (err.code === 3) {
        setError('Zeitüberschreitung bei der Standortermittlung. Bitte verwenden Sie die manuelle Eingabe.')
      } else {
        setError(err.message || 'Fehler bei der Standortermittlung. Bitte verwenden Sie die manuelle Eingabe.')
      }
    } finally {
      setIsLoading(false)
    }
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

      updateLocation({
        lat: data.lat,
        lng: data.lng,
        postal_code: data.postal_code || postalcode,
        city: data.city || city,
        street,
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
        <div>
          <h1 className="mb-4 text-2xl font-bold sm:text-3xl">Standort erfassen</h1>
          <p className="text-muted-foreground">
            Bitte teilen Sie uns Ihren Standort mit, damit wir Ihre Antworten geografisch zuordnen können.
          </p>
        </div>

        {!method && (
          <div className="space-y-4">
            <Button
              type="button"
              onClick={() => setMethod('gps')}
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              <MapPin className="mr-2 h-5 w-5" />
              Standort automatisch ermitteln (GPS)
            </Button>
            <Button
              type="button"
              onClick={() => setMethod('manual')}
              variant="outline"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              Adresse manuell eingeben
            </Button>
          </div>
        )}

        {method === 'gps' && (
          <div className="space-y-4 rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">Standort automatisch ermitteln</h2>
            <p className="text-sm text-muted-foreground">
              Wir benötigen Ihre Erlaubnis, um Ihren Standort zu ermitteln. Ihre genauen Koordinaten werden
              nicht gespeichert, nur die Postleitzahl.
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                type="button"
                onClick={handleGPSLocation}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Standort wird ermittelt...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Standort ermitteln
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMethod(null)
                  setError(null)
                }}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Zurück
              </Button>
            </div>
          </div>
        )}

        {method === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-6">
            <div className="space-y-4 rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold">Adresse eingeben</h2>
              <div className="space-y-4">
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
                      onChange={(e) => setPostalcode(e.target.value)}
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
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMethod(null)
                  setError(null)
                  setStreet('')
                  setHousenumber('')
                  setPostalcode('')
                  setCity('')
                }}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Zurück
              </Button>
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
        )}

        <div className="text-center">
          <Link href="/" className="text-sm text-muted-foreground underline hover:no-underline">
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  )
}

