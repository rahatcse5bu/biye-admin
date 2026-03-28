import api from './api'
import { ExtraField } from './unverifiedBiodataService'

interface ParsedField extends ExtraField {
  source?: string // Which line of text it came from
}

/**
 * Uses backend LLM endpoint to intelligently parse biodata text and extract custom fields
 * Ignores standard fields (name, phone, email, gender, dob, height, weight, etc.)
 * and only extracts additional/custom fields
 */
export const parseFieldsWithLLM = async (
  biodata_text: string
): Promise<{ fields: ParsedField[]; error?: string }> => {
  if (!biodata_text.trim()) {
    return { fields: [], error: 'No text provided' }
  }

  try {
    const response = await api.post('/api/v1/unverified-biodatas/admin/parse-fields', {
      biodata_text,
    })

    const fields = response.data.data || []

    // Validate and sanitize parsed fields
    const validated = fields
      .filter((field: any) => field.label && field.value !== undefined && field.fieldType)
      .map((field: any) => ({
        label: String(field.label).substring(0, 100),
        value:
          field.fieldType === 'numeric'
            ? Number(field.value) || 0
            : field.fieldType === 'boolean'
              ? Boolean(field.value)
              : String(field.value).substring(0, 500),
        fieldType: field.fieldType as ExtraField['fieldType'],
        options:
          field.fieldType === 'select' && Array.isArray(field.options)
            ? field.options.map((o: any) => String(o).substring(0, 100))
            : undefined,
      }))

    return { fields: validated }
  } catch (error: any) {
    console.error('LLM parsing error:', error.message)
    return {
      fields: [],
      error: error.message || 'Failed to parse fields with LLM',
    }
  }
}
