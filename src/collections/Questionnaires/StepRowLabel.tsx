'use client'
import type { Questionnaire } from '@/payload-types'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type SectionStep = NonNullable<
  NonNullable<Questionnaire['sections']>[number]['steps']
>[number]

export const StepRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<SectionStep>()

  const label =
    data?.stepIdentifier?.trim() ||
    `Step ${String((rowNumber ?? 0) + 1).padStart(2, '0')}`

  return <div>{label}</div>
}
