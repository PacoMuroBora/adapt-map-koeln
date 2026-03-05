import type { Questionnaire } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { unstable_cache } from 'next/cache'

async function getQuestionnaire(nameParam: string, depth: number): Promise<Questionnaire | null> {
  const payload = await getPayloadClient()
  const where =
    nameParam === 'current'
      ? { isCurrent: { equals: true } }
      : { name: { equals: nameParam } }
  const { docs } = await payload.find({
    collection: 'questionnaires',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    where: where as any,
    limit: 1,
    depth,
  })
  return (docs[0] as Questionnaire | undefined) ?? null
}

/**
 * Returns a cached fetcher for a questionnaire by name. Call the returned function to get the questionnaire.
 * Cache is keyed by name and depth; revalidates every 10 minutes.
 */
export const getCachedQuestionnaire = (nameParam: string, depth = 2) =>
  unstable_cache(
    () => getQuestionnaire(nameParam, depth),
    ['questionnaire', nameParam, String(depth)],
    { tags: ['questionnaire'], revalidate: 600 },
  )
