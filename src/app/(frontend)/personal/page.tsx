'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSubmission } from '@/providers/Submission'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

export default function PersonalPage() {
  const router = useRouter()
  const { state, updatePersonalFields, updateCurrentStep } = useSubmission()
  const [age, setAge] = useState<string>(state.personalFields?.age?.toString() || '')
  const [gender, setGender] = useState<string>(state.personalFields?.gender || '')
  const [householdSize, setHouseholdSize] = useState<string>(
    state.personalFields?.householdSize?.toString() || '',
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    updatePersonalFields({
      age: age ? parseInt(age, 10) : null,
      gender: (gender || null) as any,
      householdSize: householdSize ? parseInt(householdSize, 10) : null,
    })

    updateCurrentStep('questionnaire')
    router.push('/questionnaire/1')
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
      <div className="space-y-6">
        <div>
          <h1 className="mb-4 text-2xl font-bold sm:text-3xl">Persönliche Angaben</h1>
          <p className="text-muted-foreground">
            Diese Angaben sind optional und helfen uns, die Ergebnisse besser zu verstehen. Alle
            Daten werden anonymisiert gespeichert.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 rounded-lg border bg-card p-6">
            <div>
              <Label htmlFor="age">Alter (optional)</Label>
              <Input
                id="age"
                type="number"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="z.B. 35"
                disabled={false}
              />
            </div>

            <div>
              <Label htmlFor="gender">Geschlecht (optional)</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Bitte auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Männlich</SelectItem>
                  <SelectItem value="female">Weiblich</SelectItem>
                  <SelectItem value="diverse">Divers</SelectItem>
                  <SelectItem value="prefer_not_to_say">Keine Angabe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="householdSize">Haushaltsgröße (optional)</Label>
              <Input
                id="householdSize"
                type="number"
                min="1"
                max="20"
                value={householdSize}
                onChange={(e) => setHouseholdSize(e.target.value)}
                placeholder="Anzahl der Personen im Haushalt"
                disabled={false}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="w-full sm:w-auto"
            >
              Zurück
            </Button>
            <Button type="submit" className="w-full sm:w-auto sm:ml-auto">
              Weiter
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
