import React, { useState } from 'react'
import {
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  PencilIcon,
  EyeSlashIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  unverifiedBiodataService,
  UnverifiedBiodata,
  CreateUnverifiedBiodataPayload,
  ExtraField,
} from '../services/unverifiedBiodataService'
import { toast } from 'react-toastify'
import DynamicFieldBuilder from '../components/DynamicFieldBuilder/DynamicFieldBuilder'
import { parseFieldsWithLLM } from '../services/llmFieldParser'

/* ════════════════════════════════════════════════
   PARSER UTILITIES
   ════════════════════════════════════════════════ */

/** Bengali digit → ASCII digit */
const bn2en = (s: string) =>
  s.replace(/[০-৯]/g, (c) => String(String('০১২৩৪৫৬৭৮৯').indexOf(c)))

/** Extract value that follows a label (handles both "label : value" and "❒ label: value") */
function extractField(text: string, ...labels: string[]): string {
  for (const label of labels) {
    // Escape special regex chars in label
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(
      `(?:❒\\s*)?${escaped}\\s*[:\\-]\\s*([^\\n\\r❒]+)`,
      'i'
    )
    const m = text.match(re)
    if (m) return m[1].trim().replace(/[*""''❒]/g, '').trim()
  }
  return ''
}

/** Convert height string → cm */
function parseHeightToCm(raw: string): number | null {
  if (!raw) return null
  const s = bn2en(raw)
  // Patterns: "5'5"", "5′5″", "5 ফুট 4 ইঞ্চি", "5 feet 4 inch", "165 cm"
  const cmMatch = s.match(/(\d+)\s*(?:cm|সেমি)/i)
  if (cmMatch) return parseInt(cmMatch[1])
  const ftInMatch = s.match(/(\d+)\s*[′'ফ][^\d]*(\d+)\s*[″"ইi]?/)
  if (ftInMatch) {
    const ft = parseInt(ftInMatch[1])
    const inch = parseInt(ftInMatch[2])
    return Math.round(ft * 30.48 + inch * 2.54)
  }
  // Only feet "5 ফুট", "5'"
  const ftOnly = s.match(/(\d+)\s*(?:[′'ফ]|feet|ফুট)/)
  if (ftOnly) return Math.round(parseInt(ftOnly[1]) * 30.48)
  // Plain number possibly cm
  const plain = s.match(/(\d+)/)
  if (plain) {
    const n = parseInt(plain[1])
    return n > 50 && n < 250 ? n : null
  }
  return null
}

/** Convert weight string → kg */
function parseWeight(raw: string): number | null {
  if (!raw) return null
  const s = bn2en(raw)
  const m = s.match(/(\d+(?:\.\d+)?)/)
  return m ? parseFloat(m[1]) : null
}

const BENGALI_MONTH_MAP: Record<string, string> = {
  january: '01', february: '02', march: '03', april: '04',
  may: '05', june: '06', july: '07', august: '08',
  september: '09', october: '10', november: '11', december: '12',
  জানুয়ারি: '01', ফেব্রুয়ারি: '02', মার্চ: '03', এপ্রিল: '04',
  মে: '05', জুন: '06', জুলাই: '07', আগস্ট: '08',
  সেপ্টেম্বর: '09', অক্টোবর: '10', নভেম্বর: '11', ডিসেম্বর: '12',
  jan: '01', feb: '02', mar: '03', apr: '04',
  jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
}

/** Parse date → YYYY-MM-DD */
function parseDate(raw: string): string {
  if (!raw) return ''
  const s = bn2en(raw.trim())

  // Full date: 2002-08-15 or 15/08/2002 or 15-08-2002
  const isoMatch = s.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2,'0')}-${isoMatch[3].padStart(2,'0')}`
  }
  const dmyMatch = s.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/)
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2,'0')}-${dmyMatch[1].padStart(2,'0')}`
  }

  // "August 2002" or "আগস্ট 2002"
  for (const [month, num] of Object.entries(BENGALI_MONTH_MAP)) {
    const re = new RegExp(`${month}\\s+([12]\\d{3})`, 'i')
    const m = s.match(re)
    if (m) return `${m[1]}-${num}-01`
  }

  // Only year: "২০০২" or "2002"
  const yearOnly = s.match(/\b(19|20)(\d{2})\b/)
  if (yearOnly) return `${yearOnly[1]}${yearOnly[2]}-01-01`

  // "age 23" or "২৩ রানিং" → approximate birth year
  const ageMatch = s.match(/(\d+)\s*(?:রানিং|বছর|year)/)
  if (ageMatch) {
    const year = new Date().getFullYear() - parseInt(ageMatch[1])
    return `${year}-01-01`
  }

  return ''
}

const BLOOD_MAP: Record<string, string> = {
  'এ পজিটিভ': 'A+', 'এ নেগেটিভ': 'A-',
  'বি পজিটিভ': 'B+', 'বি নেগেটিভ': 'B-',
  'এবি পজিটিভ': 'AB+', 'এবি নেগেটিভ': 'AB-',
  'ও পজিটিভ': 'O+', 'ও নেগেটিভ': 'O-',
  'a positive': 'A+', 'a negative': 'A-',
  'b positive': 'B+', 'b negative': 'B-',
  'ab positive': 'AB+', 'ab negative': 'AB-',
  'o positive': 'O+', 'o negative': 'O-',
}

function parseBloodGroup(raw: string): string {
  if (!raw) return ''
  const lower = raw.toLowerCase().trim()
  // Direct match A+, B+, AB-, O+ etc.
  const direct = raw.trim().toUpperCase().match(/^(A|B|AB|O)[+-]$/)
  if (direct) return direct[0]
  for (const [key, val] of Object.entries(BLOOD_MAP)) {
    if (lower.includes(key)) return val
  }
  // Try to find pattern like "B+" anywhere
  const m = raw.match(/\b(A|B|AB|O)[+\-]\b/i)
  return m ? m[0].toUpperCase() : ''
}

const COMPLEXION_MAP: Record<string, string> = {
  'উজ্জ্বল ফর্সা': 'উজ্জ্বল ফর্সা',
  'ফর্সা': 'ফর্সা',
  'উজ্জ্বল শ্যামলা': 'উজ্জ্বল শ্যামলা',
  'শ্যামলা': 'শ্যামলা',
  'কালো': 'কালো',
  'fair': 'ফর্সা',
  'dark': 'শ্যামলা',
  'brown': 'শ্যামলা',
  'wheat': 'শ্যামলা',
}

function parseComplexion(raw: string): string {
  if (!raw) return ''
  const lower = raw.toLowerCase()
  for (const [key, val] of Object.entries(COMPLEXION_MAP)) {
    if (raw.includes(key) || lower.includes(key)) return val
  }
  return ''
}

const MARITAL_MAP: Record<string, string> = {
  'অবিবাহিত': 'অবিবাহিত', 'unmarried': 'অবিবাহিত', 'single': 'অবিবাহিত',
  'বিবাহিত': 'বিবাহিত', 'married': 'বিবাহিত',
  'ডিভোর্সড': 'ডিভোর্সড', 'divorced': 'ডিভোর্সড',
  'বিধবা': 'বিধবা', 'widow': 'বিধবা',
  'বিপত্নীক': 'বিপত্নীক', 'widower': 'বিপত্নীক',
}

function parseMaritalStatus(raw: string): string {
  if (!raw) return ''
  const lower = raw.toLowerCase()
  for (const [key, val] of Object.entries(MARITAL_MAP)) {
    if (raw.includes(key) || lower.includes(key)) return val
  }
  return ''
}

/** Extract email from text */
function extractEmail(text: string): string {
  const m = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)
  return m ? m[0].trim() : ''
}

/** Extract BD phone number */
function extractPhone(text: string): string {
  // Look for phone/mobile label first
  const labeled = text.match(
    /(?:mobile|phone|মোবাইল|ফোন|নম্বর|নাম্বার)\s*[:\-]?\s*((?:\+88)?01[3-9]\d{8})/i
  )
  if (labeled) return labeled[1].trim()
  // Fallback: any BD number
  const m = text.match(/(?:\+88)?01[3-9]\d{8}/)
  return m ? m[0].trim() : ''
}

/** Extract contact name: look for প্রার্থীর নাম or পাত্রের নাম */
function extractContactName(text: string): string {
  const raw = extractField(
    text,
    'প্রার্থীর নাম', 'পাত্রের নাম', 'পাত্রীর নাম',
    'নাম', 'Name', 'contact name'
  )
  // If name is hidden (e.g. "***"), return empty
  if (!raw || /^\*+$/.test(raw)) return ''
  return raw
}

/** Extract zilla from address lines */
function extractZilla(text: string): string {
  // Try "স্থায়ী ঠিকানা : গাইবান্ধা।" pattern
  const perm = extractField(text, 'স্থায়ী ঠিকানা', 'Permanent Address')
  if (perm) return perm.replace(/[।.]/g, '').split(/[,،।\n]/)[0].trim()

  // Try simple ঠিকানা
  const addr = extractField(text, 'ঠিকানা', 'Address')
  if (addr) return addr.replace(/[।.]/g, '').split(/[,،।\n]/)[0].trim()

  return ''
}

function extractDivision(text: string): string {
  const cur = extractField(text, 'বর্তমান ঠিকানা', 'বিভাগ', 'Division')
  if (cur) {
    const parts = cur.split(/[,،।]/)
    return parts[0].trim().replace(/[।.]/g, '')
  }
  return ''
}

function extractUpzilla(text: string): string {
  const raw = extractField(text, 'উপজেলা', 'Upazila', 'Upzilla')
  return raw.replace(/[।.]/g, '').trim()
}

function detectBioType(text: string): { bio_type: string; gender: string } {
  if (
    text.includes('পাত্রীর বায়োডাটা') ||
    text.includes('পাত্রী চাই') ||
    text.includes('পাত্রীর বিবরণ') ||
    text.match(/💞\s*পাত্রী\s*চাই/i)
  ) {
    return { bio_type: 'পাত্রীর বায়োডাটা', gender: 'মহিলা' }
  }
  if (
    text.includes('পাত্রের বায়োডাটা') ||
    text.includes('পাত্র চাই') ||
    text.includes('পাত্রের বিবরণ') ||
    text.match(/💞\s*পাত্র\s*চাই/i)
  ) {
    return { bio_type: 'পাত্রের বায়োডাটা', gender: 'পুরুষ' }
  }
  // Default guess from bio type field value
  const bt = extractField(text, 'বায়োডাটার ধরন', 'Bio Type')
  if (bt.includes('পাত্রী')) return { bio_type: 'পাত্রীর বায়োডাটা', gender: 'মহিলা' }
  return { bio_type: 'পাত্রের বায়োডাটা', gender: 'পুরুষ' }
}

/** MAIN PARSER — returns partial form */
function parseBiodataText(text: string): Partial<CreateUnverifiedBiodataPayload> & { _parsed: string[] } {
  const parsed: string[] = []
  const result: Partial<CreateUnverifiedBiodataPayload> = {}

  // Bio type + gender
  const { bio_type, gender } = detectBioType(text)
  result.bio_type = bio_type
  result.gender = gender
  parsed.push(`Bio Type: ${bio_type}`)

  // Date of birth
  const dobRaw = extractField(text, 'জন্মসন', 'জন্ম তারিখ', 'Date of Birth', 'DOB', 'আসল বয়স', 'বয়স')
  const dob = parseDate(dobRaw)
  if (dob) { result.date_of_birth = dob; parsed.push(`DOB: ${dob}`) }

  // Height
  const heightRaw = extractField(text, 'উচ্চতা', 'Height')
  const height = parseHeightToCm(heightRaw)
  if (height) { result.height = height; parsed.push(`Height: ${height}cm`) }

  // Weight
  const weightRaw = extractField(text, 'ওজন', 'Weight')
  const weight = parseWeight(weightRaw)
  if (weight) { result.weight = weight; parsed.push(`Weight: ${weight}kg`) }

  // Blood group
  const bgRaw = extractField(text, 'রক্তের গ্রুপ', 'Blood Group', 'রক্তের গ্রুপঃ')
  const bg = parseBloodGroup(bgRaw)
  if (bg) { result.blood_group = bg; parsed.push(`Blood: ${bg}`) }

  // Complexion
  const complexRaw = extractField(text, 'গাত্রবর্ণ', 'গাত্রবর্ন', 'বর্ণ', 'Complexion', 'Color')
  const complexion = parseComplexion(complexRaw)
  if (complexion) { result.screen_color = complexion; parsed.push(`Complexion: ${complexion}`) }

  // Marital status
  const msRaw = extractField(text, 'বৈবাহিক অবস্থা', 'Marital Status')
  const ms = parseMaritalStatus(msRaw)
  if (ms) { result.marital_status = ms; parsed.push(`Marital: ${ms}`) }

  // Nationality
  const nat = extractField(text, 'জাতীয়তা', 'Nationality')
  if (nat && nat.length < 30) { result.nationality = nat.replace(/[।.]/g, '').trim(); parsed.push(`Nationality: ${result.nationality}`) }

  // Zilla
  const zilla = extractZilla(text)
  if (zilla && zilla.length < 40) { result.zilla = zilla; parsed.push(`Zilla: ${zilla}`) }

  // Upzilla
  const upzilla = extractUpzilla(text)
  if (upzilla && upzilla.length < 40) { result.upzilla = upzilla; parsed.push(`Upzilla: ${upzilla}`) }

  // Division
  const div = extractDivision(text)
  if (div && div.length < 40) { result.division = div; parsed.push(`Division: ${div}`) }

  // Contact email
  const email = extractEmail(text)
  if (email) { result.contact_email = email; parsed.push(`Email: ${email}`) }

  // Contact phone
  const phone = extractPhone(text)
  if (phone) { result.contact_phone = phone; parsed.push(`Phone: ${phone}`) }

  // Contact name
  const name = extractContactName(text)
  if (name) { result.contact_name = name; parsed.push(`Name: ${name}`) }

  return { ...result, _parsed: parsed } as any
}

/* ════════════════════════════════════════════════
   CONSTANTS
   ════════════════════════════════════════════════ */
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const RELIGIONS = [
  { value: 'islam', label: 'Islam' },
  { value: 'hinduism', label: 'Hinduism' },
  { value: 'christianity', label: 'Christianity' },
]
const RELIGIOUS_TYPES: Record<string, { value: string; label: string }[]> = {
  islam: [
    { value: 'practicing_muslim', label: 'প্র্যাক্টিসিং মুসলিম' },
    { value: 'general_muslim', label: 'সাধারণ মুসলিম' },
  ],
  hinduism: [
    { value: 'practicing_hindu', label: 'প্র্যাক্টিসিং হিন্দু' },
    { value: 'general_hindu', label: 'সাধারণ হিন্দু' },
  ],
  christianity: [
    { value: 'practicing_christian', label: 'প্র্যাক্টিসিং খ্রিস্টান' },
    { value: 'general_christian', label: 'সাধারণ খ্রিস্টান' },
  ],
}
const MARITAL_STATUSES = ['অবিবাহিত', 'বিবাহিত', 'ডিভোর্সড', 'বিধবা', 'বিপত্নীক']
const BIO_TYPES = ['পাত্রের বায়োডাটা', 'পাত্রীর বায়োডাটা']
const GENDERS = ['পুরুষ', 'মহিলা']
const COMPLEXIONS = ['উজ্জ্বল ফর্সা', 'ফর্সা', 'শ্যামলা', 'উজ্জ্বল শ্যামলা', 'কালো']

const EMPTY_FORM: CreateUnverifiedBiodataPayload & { extra_fields?: IExtraField[] } = {
  bio_type: 'পাত্রের বায়োডাটা',
  gender: 'পুরুষ',
  date_of_birth: '',
  height: 165,
  weight: 65,
  blood_group: 'A+',
  screen_color: 'শ্যামলা',
  nationality: 'বাংলাদেশী',
  marital_status: 'অবিবাহিত',
  religion: 'islam',
  religious_type: 'practicing_muslim',
  zilla: '',
  upzilla: '',
  division: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  extra_fields: [],
}

/* ════════════════════════════════════════════════
   FORM MODAL
   ════════════════════════════════════════════════ */
const BiodataFormModal: React.FC<{
  initial?: UnverifiedBiodata | null
  onClose: () => void
  onSave: (payload: CreateUnverifiedBiodataPayload & { extra_fields?: IExtraField[] }) => void
  saving: boolean
}> = ({ initial, onClose, onSave, saving }) => {
  const [form, setForm] = useState<CreateUnverifiedBiodataPayload & { extra_fields?: IExtraField[] }>(
    initial
      ? {
          bio_type: initial.bio_type,
          gender: initial.gender,
          date_of_birth: initial.date_of_birth?.split('T')[0] || '',
          height: initial.height,
          weight: initial.weight,
          blood_group: initial.blood_group,
          screen_color: initial.screen_color,
          nationality: initial.nationality,
          marital_status: initial.marital_status,
          religion: initial.religion,
          religious_type: initial.religious_type,
          zilla: initial.zilla,
          upzilla: initial.upzilla,
          division: initial.division,
          contact_name: initial.contact_name,
          contact_phone: initial.contact_phone,
          contact_email: initial.contact_email,
          extra_fields: initial.extra_fields || [],
        }
      : EMPTY_FORM
  )

  const [showImport, setShowImport] = useState(!initial)
  const [rawText, setRawText] = useState('')
  const [parsedFields, setParsedFields] = useState<string[]>([])
  const [parseDone, setParseDone] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<string[]>([])
  const [llmParsing, setLlmParsing] = useState(false)
  const [llmExtractedFields, setLlmExtractedFields] = useState<ExtraField[]>([])
  const [llmError, setLlmError] = useState<string>('')

  const set = (field: keyof typeof form, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleParse = () => {
    if (!rawText.trim()) return
    const { _parsed, ...parsed } = parseBiodataText(rawText) as any
    setForm((prev) => ({
      ...prev,
      ...Object.fromEntries(
        Object.entries(parsed).filter(([, v]) => v !== undefined && v !== null && v !== '')
      ),
    }))
    setParsedFields(_parsed)
    setParseDone(true)
  }

  const handleParseLLMFields = async () => {
    if (!rawText.trim()) return
    setLlmParsing(true)
    setLlmError('')
    setLlmExtractedFields([])

    const { fields, error } = await parseFieldsWithLLM(rawText)

    if (error) {
      setLlmError(error)
      toast.error(`LLM parsing failed: ${error}`)
    } else if (fields.length === 0) {
      setLlmError('No custom fields could be extracted from the text')
      toast.info('No additional fields found beyond standard ones')
    } else {
      setLlmExtractedFields(fields)
      toast.success(`Found ${fields.length} custom field(s)!`)
    }

    setLlmParsing(false)
  }

  const addExtractedFields = () => {
    set('extra_fields', [...(form.extra_fields || []), ...llmExtractedFields])
    setLlmExtractedFields([])
    toast.success(`${llmExtractedFields.length} field(s) added!`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors([])
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-800">
            {initial ? 'Edit Unverified Biodata' : 'Add Unverified Biodata'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* ── Import from Text ── */}
          <div className="border border-indigo-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowImport((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-medium text-sm"
            >
              <span className="flex items-center gap-2">
                <SparklesIcon className="w-4 h-4" />
                Auto-fill from pasted biodata text
              </span>
              {showImport ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
            </button>

            {showImport && (
              <div className="p-4 space-y-3 bg-indigo-50/40">
                <p className="text-xs text-gray-500">
                  Paste any biodata text (structured, WhatsApp-style, ❒ format, etc.). Fields will be auto-extracted.
                </p>
                <textarea
                  rows={8}
                  value={rawText}
                  onChange={(e) => { setRawText(e.target.value); setParseDone(false) }}
                  placeholder={`বায়োডাটার ধরন : পাত্রের বায়োডাটা\nজন্মসন : August 2002\nউচ্চতা : ৫′ ৫″\nওজন : ৫৮কেজি\n...\n\nOr paste any WhatsApp/group format`}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleParse}
                    disabled={!rawText.trim()}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-40"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    Parse & Fill Fields
                  </button>
                  {rawText && (
                    <button
                      type="button"
                      onClick={() => { setRawText(''); setParsedFields([]); setParseDone(false) }}
                      className="px-3 py-2 text-xs text-gray-500 hover:text-gray-800"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {parseDone && (
                  <div className={`rounded-lg px-4 py-3 text-xs ${parsedFields.length > 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                    {parsedFields.length > 0 ? (
                      <>
                        <p className="font-semibold text-green-800 mb-1">
                          ✓ {parsedFields.length} field{parsedFields.length > 1 ? 's' : ''} extracted — review below and fill in any missing fields manually.
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {parsedFields.map((f, i) => (
                            <span key={i} className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              {f}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-amber-800">No fields could be extracted. Please fill manually.</p>
                    )}
                  </div>
                )}

                {/* LLM Custom Fields Extraction */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleParseLLMFields}
                    disabled={!rawText.trim() || llmParsing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg disabled:opacity-40"
                  >
                    <SparklesIcon className="w-4 h-4" />
                    {llmParsing ? 'Extracting custom fields...' : 'Extract Custom Fields with AI'}
                  </button>
                  <p className="text-xs text-indigo-600 mt-1">
                    💡 AI will intelligently extract fields like profession, income, education, etc.
                  </p>
                </div>

                {/* LLM Extracted Fields Preview */}
                {llmExtractedFields.length > 0 && (
                  <div className="mt-3 rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                    <p className="text-xs font-semibold text-indigo-800 mb-2">
                      ✨ {llmExtractedFields.length} custom field{llmExtractedFields.length > 1 ? 's' : ''} found:
                    </p>
                    <div className="space-y-2 mb-3">
                      {llmExtractedFields.map((field, i) => (
                        <div key={i} className="bg-white p-2 rounded border border-indigo-100 text-xs">
                          <p className="font-medium text-gray-800">{field.label}</p>
                          <p className="text-gray-600">
                            Value: {String(field.value)} | Type: {field.fieldType}
                          </p>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addExtractedFields}
                      className="w-full px-3 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                    >
                      Add {llmExtractedFields.length} Field{llmExtractedFields.length > 1 ? 's' : ''} to Form
                    </button>
                  </div>
                )}

                {llmError && (
                  <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
                    <p className="text-xs text-red-700">⚠️ {llmError}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Form Fields ── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bio Type *</label>
                <select
                  value={form.bio_type}
                  onChange={(e) => set('bio_type', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {BIO_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Gender *</label>
                <select
                  value={form.gender}
                  onChange={(e) => set('gender', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {GENDERS.map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => set('date_of_birth', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Marital Status *</label>
                <select
                  value={form.marital_status}
                  onChange={(e) => set('marital_status', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {MARITAL_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Height (cm) *</label>
                <input
                  type="number"
                  value={form.height}
                  onChange={(e) => set('height', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Weight (kg) *</label>
                <input
                  type="number"
                  value={form.weight}
                  onChange={(e) => set('weight', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Blood Group *</label>
                <select
                  value={form.blood_group}
                  onChange={(e) => set('blood_group', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Complexion *</label>
                <select
                  value={form.screen_color}
                  onChange={(e) => set('screen_color', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {COMPLEXIONS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Religion *</label>
                <select
                  value={form.religion}
                  onChange={(e) => {
                    const rel = e.target.value
                    set('religion', rel)
                    set('religious_type', RELIGIOUS_TYPES[rel]?.[0]?.value || '')
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {RELIGIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Religious Type *</label>
              <select
                value={form.religious_type || ''}
                onChange={(e) => set('religious_type', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                {(RELIGIOUS_TYPES[form.religion] || []).map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Division</label>
                <input
                  type="text"
                  value={form.division || ''}
                  onChange={(e) => set('division', e.target.value)}
                  placeholder="e.g. রংপুর"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Zilla *</label>
                <input
                  type="text"
                  value={form.zilla}
                  onChange={(e) => set('zilla', e.target.value)}
                  placeholder="e.g. গাইবান্ধা"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Upzilla</label>
                <input
                  type="text"
                  value={form.upzilla || ''}
                  onChange={(e) => set('upzilla', e.target.value)}
                  placeholder="e.g. সাঘাটা"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <hr className="my-2" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Contact Info (revealed after 50-point purchase)
            </p>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
              <input
                type="text"
                value={form.contact_name}
                onChange={(e) => set('contact_name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input
                  type="text"
                  value={form.contact_phone}
                  onChange={(e) => set('contact_phone', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => set('contact_email', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* ── Custom Fields Section ── */}
            <hr className="my-2" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Custom Fields (Optional)
            </p>

            {fieldErrors.length > 0 && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-xs font-medium text-red-800 mb-1">Field Validation Errors:</p>
                <ul className="text-xs text-red-700 space-y-1">
                  {fieldErrors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <DynamicFieldBuilder
              value={form.extra_fields || []}
              onChange={(fields) => set('extra_fields', fields)}
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60"
              >
                {saving ? 'Saving…' : initial ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════ */
const UnverifiedBiodatas: React.FC = () => {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<UnverifiedBiodata | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['unverified-biodatas', page, search],
    queryFn: () => unverifiedBiodataService.getAll(page, 20, search || undefined),
  })

  const createMut = useMutation({
    mutationFn: unverifiedBiodataService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unverified-biodatas'] })
      toast.success('Unverified biodata created!')
      setShowForm(false)
    },
    onError: () => toast.error('Failed to create biodata'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      unverifiedBiodataService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unverified-biodatas'] })
      toast.success('Biodata updated!')
      setEditTarget(null)
      setShowForm(false)
    },
    onError: () => toast.error('Update failed'),
  })

  const deleteMut = useMutation({
    mutationFn: unverifiedBiodataService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unverified-biodatas'] })
      toast.success('Deleted!')
    },
    onError: () => toast.error('Delete failed'),
  })

  const toggleActive = (item: UnverifiedBiodata) =>
    updateMut.mutate({ id: item._id, payload: { is_active: !item.is_active } })

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this biodata permanently?')) return
    deleteMut.mutate(id)
  }

  const biodatas: UnverifiedBiodata[] = data?.data || []
  const totalPages: number = data?.totalPages || 1
  const totalItems: number = data?.totalItems || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Unverified Biodatas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Admin-added biodatas — users purchase contact info for <strong>50 points</strong>
          </p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
        >
          <PlusIcon className="w-4 h-4" />
          Add Biodata
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or zilla…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1) } }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => { setSearch(searchInput); setPage(1) }}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
          >
            Search
          </button>
          {search && (
            <button
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}
              className="px-3 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <span className="text-sm font-medium text-slate-700">
            {totalItems} unverified biodata{totalItems !== 1 ? 's' : ''}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : biodatas.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            No unverified biodatas yet.{' '}
            <button
              onClick={() => { setEditTarget(null); setShowForm(true) }}
              className="text-indigo-600 hover:underline"
            >
              Add one
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-3 font-medium text-slate-600">Bio ID</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Type</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Religion</th>
                  <th className="px-4 py-3 font-medium text-slate-600">DOB</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Zilla</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Contact Name</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Phone</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Views / Buys</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {biodatas.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      UB-{item.bio_id?.toString().slice(-6)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.bio_type === 'পাত্রের বায়োডাটা'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-pink-100 text-pink-700'
                      }`}>
                        {item.bio_type === 'পাত্রের বায়োডাটা' ? 'Male' : 'Female'}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-700">{item.religion}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.date_of_birth ? format(new Date(item.date_of_birth), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.zilla}</td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{item.contact_name}</td>
                    <td className="px-4 py-3 text-slate-600">{item.contact_phone}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.views_count} / {item.purchases_count}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditTarget(item); setShowForm(true) }}
                          title="Edit"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleActive(item)}
                          title={item.is_active ? 'Hide' : 'Show'}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                        >
                          {item.is_active
                            ? <EyeSlashIcon className="w-4 h-4" />
                            : <EyeIcon className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          title="Delete"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <BiodataFormModal
          initial={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null) }}
          onSave={(payload) => {
            if (editTarget) {
              updateMut.mutate({ id: editTarget._id, payload })
            } else {
              createMut.mutate(payload)
            }
          }}
          saving={createMut.isPending || updateMut.isPending}
        />
      )}
    </div>
  )
}

export default UnverifiedBiodatas
