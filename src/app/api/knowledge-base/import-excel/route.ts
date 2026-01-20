import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import * as XLSX from 'xlsx'
import type { PayloadRequest } from 'payload'
import { getPayloadClient } from '@/lib/payload'
import { categoryOptions } from '@/collections/KnowledgeBaseItems/categoryOptions'

export async function POST(request: Request) {
  try {
    const payload = await getPayloadClient()

    // Check authentication via cookies (Payload admin panel uses cookies)
    const cookieStore = await cookies()
    const token = cookieStore.get('payload-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 })
    }

    // Verify user is authenticated and has access
    let user
    try {
      const authResult = await payload.auth({
        headers: request.headers,
      } as PayloadRequest)
      user = authResult.user
    } catch (error) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin or editor role
    const userRoles = user.roles || []
    if (!userRoles.includes('admin') && !userRoles.includes('editor')) {
      return NextResponse.json(
        { error: 'Forbidden - Admin or Editor access required' },
        { status: 403 },
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read Excel file
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert to array of arrays (index-based)
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][]

    if (data.length < 2) {
      return NextResponse.json({ error: 'Excel file must have at least a header row and one data row' }, { status: 400 })
    }

    // Expected column order (0-indexed)
    const COLUMN_INDEXES = {
      COMPANY: 0,
      THEME: 1,
      DESCRIPTION: 2,
      PROBLEMS_SOLVED: 3,
      LOCATION: 4,
      ADDITIONAL_CONTEXT: 5,
      SOLUTION_TYPE: 6,
      LINKS: 7,
      CATEGORIES: 8,
      USE_CASE: 9,
      APPLICABLE_WHEN: 10,
      KEYWORDS: 11,
    }

    // Skip header row (index 0), start from index 1
    const rows = data.slice(1)

    // Normalize theme value - handle variations like "Gebaeuden" vs "Gebäuden"
    const normalizeTheme = (theme: string | undefined): string | undefined => {
      if (!theme) return undefined

      const normalized = theme
        .toString()
        .trim()
        .toLowerCase()
        // Normalize German umlauts: ä -> ae, ö -> oe, ü -> ue
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        // Normalize spaces and special characters
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      // Map to valid theme values (handles both "gebaeuden" and "gebäuden" -> "gebaeuden")
      const themeMap: Record<string, string> = {
        'cool-on-demand': 'cool-on-demand',
        'hitze-in-stadt-gebaeuden': 'hitze-in-stadt-gebaeuden',
        'hitzeschutz-infrastruktur-cool-pavement': 'hitzeschutz-infrastruktur-cool-pavement',
        'personelle-kuehlung': 'personelle-kuehlung',
        'wearable-hitzeschutz-personen': 'wearable-hitzeschutz-personen',
        'air-quality': 'air-quality',
        'hitze': 'hitze',
        'hitze-an-der-person': 'hitze-an-der-person',
        'hitzeschutz-von-gebaeuden': 'hitzeschutz-von-gebaeuden',
      }

      // Check if normalized value exists in map, otherwise try fuzzy matching
      if (themeMap[normalized]) {
        return themeMap[normalized]
      }

      // Fuzzy match: check if normalized contains key parts
      for (const [key, value] of Object.entries(themeMap)) {
        // Remove common words and compare
        const keyParts = key.split('-').filter((p) => !['von', 'der', 'in', 'an'].includes(p))
        const normalizedParts = normalized.split('-').filter((p) => !['von', 'der', 'in', 'an'].includes(p))
        
        // If most parts match, use the mapped value
        const matchingParts = keyParts.filter((kp) => normalizedParts.includes(kp))
        if (matchingParts.length >= Math.min(keyParts.length, normalizedParts.length) * 0.7) {
          return value
        }
      }

      // Return normalized value as-is (will be validated by Payload)
      return normalized
    }

    // Normalize category label to value
    // Creates a map from label (case-insensitive, handles variations) to value
    const categoryLabelToValue = new Map<string, string>()
    categoryOptions.forEach((option) => {
      // Map exact label
      categoryLabelToValue.set(option.label.toLowerCase().trim(), option.value)
      // Map normalized label (handle umlauts, spaces, special chars)
      const normalizedLabel = option.label
        .toLowerCase()
        .trim()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/\s+/g, ' ')
        .replace(/[^a-z0-9\s/]/g, '')
      categoryLabelToValue.set(normalizedLabel, option.value)
    })

    const normalizeCategory = (categoryLabel: string): string | null => {
      const normalized = categoryLabel
        .toLowerCase()
        .trim()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')

      // Try exact match first
      if (categoryLabelToValue.has(normalized)) {
        return categoryLabelToValue.get(normalized)!
      }

      // Try with normalized spaces/slashes
      const normalizedWithSpaces = normalized.replace(/\s+/g, ' ').replace(/[^a-z0-9\s/]/g, '')
      if (categoryLabelToValue.has(normalizedWithSpaces)) {
        return categoryLabelToValue.get(normalizedWithSpaces)!
      }

      // Try fuzzy match - check if any label contains this or vice versa
      for (const [label, value] of categoryLabelToValue.entries()) {
        if (label.includes(normalized) || normalized.includes(label)) {
          return value
        }
      }

      return null
    }

    // Fetch all existing companies and tips to check for duplicates
    // This is more efficient than querying for each row
    const existingItems = await payload.find({
      collection: 'knowledge-base-items',
      limit: 10000, // Adjust if you have more items
      depth: 0,
      select: {
        companyOrTip: true,
      },
    })

    // Build sets of existing companies (case-insensitive) and tips (exact match)
    const existingCompanies = new Set<string>()
    const existingTips = new Set<string>()

    existingItems.docs.forEach((item: any) => {
      if (item.companyOrTip?.company) {
        // Normalize company name for case-insensitive comparison
        existingCompanies.add(item.companyOrTip.company.trim().toLowerCase())
      }
      if (item.companyOrTip?.tip) {
        // Tips are compared exactly (trimmed)
        existingTips.add(item.companyOrTip.tip.trim())
      }
    })

    // Map Excel columns to KB item fields
    const imported: string[] = []
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // +2 because Excel is 1-indexed and we have header row

      try {
        // Helper to get column value by index
        const getValue = (index: number): string | undefined => {
          const value = row[index]
          return value ? value.toString().trim() : undefined
        }

        // Extract company or tip (column 0)
        // Tips are in the Company field prefixed with "Tipp: "
        const companyField = getValue(COLUMN_INDEXES.COMPANY) || ''
        let company: string | undefined = undefined
        let tip: string | undefined = undefined

        if (companyField) {
          if (companyField.toLowerCase().startsWith('tipp:')) {
            // This is a tip - extract content after "Tipp: "
            tip = companyField.replace(/^tipp:\s*/i, '').trim()
          } else {
            // This is a company name
            company = companyField
          }
        }

        if (!company && !tip) {
          errors.push(`Row ${rowNum}: Company field is required (or use "Tipp: " prefix for tips)`)
          continue
        }

        // Build KB item data using index-based column access
        const kbItemData: any = {
          companyOrTip: {
            company: company || undefined,
            tip: tip || undefined,
          },
          theme: normalizeTheme(getValue(COLUMN_INDEXES.THEME)),
          description: getValue(COLUMN_INDEXES.DESCRIPTION) || undefined,
          problems_solved: getValue(COLUMN_INDEXES.PROBLEMS_SOLVED) || undefined,
          location: getValue(COLUMN_INDEXES.LOCATION) || undefined,
          additional_context: getValue(COLUMN_INDEXES.ADDITIONAL_CONTEXT) || undefined,
          solution_type: getValue(COLUMN_INDEXES.SOLUTION_TYPE) || undefined,
          link: getValue(COLUMN_INDEXES.LINKS) || undefined,
          use_case: getValue(COLUMN_INDEXES.USE_CASE) || undefined,
          applicable_when: getValue(COLUMN_INDEXES.APPLICABLE_WHEN) || undefined,
          status: 'draft', // Default status, can be added as a column later if needed
        }

        // Parse categories (comma-separated, column 8)
        // Categories come as labels like "Hitzeschutz, Gebaeude" and need to be mapped to values
        const categoriesStr = getValue(COLUMN_INDEXES.CATEGORIES)
        if (categoriesStr) {
          const categoryLabels = categoriesStr
            .split(',')
            .map((c: string) => c.trim())
            .filter((c: string) => c.length > 0)

          const categoryValues: string[] = []
          const invalidCategories: string[] = []

          categoryLabels.forEach((label) => {
            const value = normalizeCategory(label)
            if (value) {
              categoryValues.push(value)
            } else {
              invalidCategories.push(label)
            }
          })

          if (categoryValues.length > 0) {
            kbItemData.categories = categoryValues
          }

          if (invalidCategories.length > 0) {
            errors.push(
              `Row ${rowNum}: Invalid categories (will be skipped): ${invalidCategories.join(', ')}`,
            )
          }
        }

        // Parse keywords (comma-separated, column 11)
        const keywordsStr = getValue(COLUMN_INDEXES.KEYWORDS)
        if (keywordsStr) {
          kbItemData.keywords = keywordsStr
            .split(',')
            .map((k: string) => ({ keyword: k.trim() }))
            .filter((k: { keyword: string }) => k.keyword.length > 0)
        }

        // Validate status
        if (!['draft', 'published', 'archived'].includes(kbItemData.status)) {
          kbItemData.status = 'draft'
        }

        // Check for duplicates before creating
        let isDuplicate = false
        let duplicateReason = ''

        if (company) {
          // Check if company already exists (case-insensitive comparison)
          const normalizedCompany = company.trim().toLowerCase()
          if (existingCompanies.has(normalizedCompany)) {
            isDuplicate = true
            duplicateReason = `Company "${company}" already exists`
          }
        } else if (tip) {
          // Check if tip already exists (exact match after trimming)
          const normalizedTip = tip.trim()
          if (existingTips.has(normalizedTip)) {
            isDuplicate = true
            duplicateReason = `Tip already exists`
          }
        }

        if (isDuplicate) {
          errors.push(`Row ${rowNum}: Skipped duplicate - ${duplicateReason}`)
          continue
        }

        // Create KB item - sync will happen automatically via hook if status is 'published'
        const created = await payload.create({
          collection: 'knowledge-base-items',
          data: kbItemData,
        })

        // Add to existing sets to prevent duplicates within the same import
        if (company) {
          existingCompanies.add(company.trim().toLowerCase())
        } else if (tip) {
          existingTips.add(tip.trim())
        }

        imported.push(created.id)
      } catch (error) {
        errors.push(
          `Row ${rowNum}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    }

    return NextResponse.json({
      message: `Import completed. ${imported.length} items imported${errors.length > 0 ? `, ${errors.length} errors` : ''}`,
      imported: imported.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Excel import error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to import Excel file',
      },
      { status: 500 },
    )
  }
}
