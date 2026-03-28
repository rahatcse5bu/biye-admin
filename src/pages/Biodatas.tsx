import React, { useState } from 'react'
import {
  EyeIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  NoSymbolIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { biodataService, Biodata, BiodataDetail } from '../services/biodataService'
import { toast } from 'react-toastify'

/* ── Diff helpers ────────────────────────────────────────── */
const SKIPPED_DIFF_FIELDS = new Set([
  '_id', '__v', 'user', 'createdAt', 'updatedAt',
  'biodata_status', 'version', 'pending_changes', 'approved_data',
  'admin_note', 'last_approved_at', 'last_approved_by',
])

const FIELD_LABELS: Record<string, string> = {
  bio_type: 'বায়োডাটার ধরন',
  gender: 'লিঙ্গ',
  date_of_birth: 'জন্ম তারিখ',
  height: 'উচ্চতা (cm)',
  weight: 'ওজন (kg)',
  blood_group: 'রক্তের গ্রুপ',
  screen_color: 'গায়ের রঙ',
  marital_status: 'বৈবাহিক অবস্থা',
  nationality: 'জাতীয়তা',
  religion: 'ধর্ম',
  religious_type: 'ধর্মীয় ধারা',
  request_practicing_status: 'প্র্যাকটিসিং স্ট্যাটাস',
  photos: 'ছবি',
  zilla: 'জেলা',
  isFeatured: 'ফিচার্ড',
  isMarriageDone: 'বিয়ে সম্পন্ন',
}

function fmtVal(val: any): string {
  if (val === null || val === undefined || val === '') return '—'
  if (typeof val === 'boolean') return val ? 'হ্যাঁ' : 'না'
  if (Array.isArray(val)) return val.join(', ')
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

/* ── Detail Modal ─────────────────────────────────────────── */
const BiodataDetailModal: React.FC<{ userId: number; onClose: () => void }> = ({ userId, onClose }) => {
  const queryClient = useQueryClient()
  const [rejectReason, setRejectReason] = React.useState('')
  const [showRejectInput, setShowRejectInput] = React.useState(false)

  const { data, isLoading, error } = useQuery<BiodataDetail>({
    queryKey: ['biodata-detail', userId],
    queryFn: () => biodataService.getBiodataByUserId(userId),
  })

  const approveMut = useMutation({
    mutationFn: (id: string) => biodataService.approveBiodataChanges(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biodata-detail', userId] })
      queryClient.invalidateQueries({ queryKey: ['biodatas'] })
      toast.success('Biodata changes approved and published!')
    },
    onError: () => toast.error('Failed to approve changes'),
  })

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => biodataService.rejectBiodataChanges(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biodata-detail', userId] })
      queryClient.invalidateQueries({ queryKey: ['biodatas'] })
      toast.success('Biodata changes rejected')
      setShowRejectInput(false)
      setRejectReason('')
    },
    onError: () => toast.error('Failed to reject changes'),
  })

  if (isLoading) return (
    <ModalShell onClose={onClose} title={`Biodata #${userId}`}>
      <div className="flex justify-center py-16"><ArrowPathIcon className="h-8 w-8 animate-spin text-blue-500" /></div>
    </ModalShell>
  )

  if (error || !data) return (
    <ModalShell onClose={onClose} title={`Biodata #${userId}`}>
      <p className="text-red-600 p-4">Failed to load biodata details.</p>
    </ModalShell>
  )

  const g = data.generalInfo
  const addr = data.address
  const edu = data.educationQualification
  const fam = data.familyStatus
  const occ = data.occupation
  const personal = data.personalInfo
  const marital = data.maritalInfo
  const partner = data.expectedLifePartner
  const pledge = data.ongikarNama
  const contact = data.contact

  return (
    <ModalShell onClose={onClose} title={`Biodata #${userId} — ${g?.bio_type || ''}`}>
      <div className="space-y-6 p-1 max-h-[70vh] overflow-y-auto">
        {/* Pending Changes Review Banner */}
        {g?.biodata_status === 'pending' && g?.pending_changes && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <DocumentDuplicateIcon className="h-5 w-5 text-amber-600" />
              <h3 className="font-bold text-amber-800 text-lg">Pending Changes (v{(g.version || 1) + 1})</h3>
              <span className="ml-auto inline-flex px-2 py-0.5 text-xs font-bold rounded-full bg-amber-200 text-amber-800">NEEDS REVIEW</span>
            </div>
            {(() => {
              const approved = (g.approved_data && typeof g.approved_data === 'object')
                ? g.approved_data as Record<string, any>
                : {}
              const pending = g.pending_changes as Record<string, any>
              const changedKeys = Object.keys(pending).filter(
                key => !SKIPPED_DIFF_FIELDS.has(key) && fmtVal(pending[key]) !== fmtVal(approved[key])
              )
              if (changedKeys.length === 0) {
                return <p className="text-sm text-amber-700 italic">কোনো পরিবর্তিত ক্ষেত্র পাওয়া যায়নি।</p>
              }
              return (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="pb-1.5 pr-3 text-left text-xs font-semibold text-gray-500 uppercase w-1/4">ক্ষেত্র</th>
                      <th className="pb-1.5 pr-3 text-left text-xs font-semibold text-red-600 uppercase w-[37.5%]">বর্তমান (অনুমোদিত)</th>
                      <th className="pb-1.5 text-left text-xs font-semibold text-green-700 uppercase w-[37.5%]">পরিবর্তন (রিভিউ বাকি)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {changedKeys.map(key => {
                      const approvedVal = approved[key]
                      const isNew = !(key in approved) || approvedVal === undefined || approvedVal === null
                      const label = FIELD_LABELS[key] ?? key.replace(/_/g, ' ')
                      return (
                        <tr key={key}>
                          <td className="py-1.5 pr-3 font-medium text-gray-700 align-top">{label}</td>
                          <td className="py-1.5 pr-3 align-top">
                            {isNew
                              ? <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">নতুন</span>
                              : <span className="block break-words text-red-700 bg-red-50 px-1.5 py-0.5 rounded">{fmtVal(approvedVal)}</span>
                            }
                          </td>
                          <td className="py-1.5 align-top">
                            <span className="block break-words text-green-800 bg-green-50 px-1.5 py-0.5 rounded">{fmtVal(pending[key])}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )
            })()}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => approveMut.mutate(g._id)}
                disabled={approveMut.isPending}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm disabled:opacity-50"
              >
                {approveMut.isPending ? 'Approving...' : '✅ Approve & Publish'}
              </button>
              {!showRejectInput ? (
                <button
                  onClick={() => setShowRejectInput(true)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm"
                >
                  ❌ Reject Changes
                </button>
              ) : (
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection..."
                    className="w-full border border-red-300 rounded-md px-3 py-1.5 text-sm focus:ring-red-500 focus:border-red-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => rejectMut.mutate({ id: g._id, reason: rejectReason })}
                      disabled={rejectMut.isPending}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold disabled:opacity-50"
                    >
                      {rejectMut.isPending ? 'Rejecting...' : 'Confirm Reject'}
                    </button>
                    <button onClick={() => { setShowRejectInput(false); setRejectReason('') }} className="px-3 py-1.5 border rounded text-xs">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rejected note */}
        {g?.biodata_status === 'rejected' && g?.admin_note && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700"><span className="font-semibold">Rejected:</span> {g.admin_note}</p>
          </div>
        )}

        {/* Version info */}
        {g?.version && g.version > 1 && (
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <span>📋 Version {g.version}</span>
            {g.last_approved_at && <span>· Last approved: {format(new Date(g.last_approved_at), 'dd MMM yy HH:mm')}</span>}
          </div>
        )}

        {/* Contact Info — Highlighted */}
        {contact && (
          <Section title="📞 Guardian / Contact Info" accent>
            <KV label="Guardian Name" value={contact.full_name} />
            <KV label="Relation" value={contact.relation} />
            <KV label="Phone Number" value={contact.family_number} />
            <KV label="Email" value={contact.bio_receiving_email} />
          </Section>
        )}

        {/* General */}
        {g && (
          <Section title="General Info">
            <KV label="Bio Type" value={g.bio_type} />
            <KV label="Gender" value={g.gender} />
            <KV label="DOB" value={g.date_of_birth ? format(new Date(g.date_of_birth), 'dd MMM yyyy') : ''} />
            <KV label="Height" value={g.height ? `${g.height} cm` : ''} />
            <KV label="Weight" value={g.weight ? `${g.weight} kg` : ''} />
            <KV label="Blood Group" value={g.blood_group} />
            <KV label="Screen Color" value={g.screen_color} />
            <KV label="Marital Status" value={g.marital_status} />
            <KV label="Nationality" value={g.nationality} />
            <KV label="Religion" value={g.religion} />
            <KV label="Religious Type" value={g.religious_type} />
            <KV label="Views" value={g.views_count} />
            <KV label="Likes" value={g.likes_count} />
            <KV label="Purchases" value={g.purchases_count} />
            <KV label="Featured" value={g.isFeatured ? 'Yes' : 'No'} />
            <KV label="Marriage Done" value={g.isMarriageDone ? 'Yes' : 'No'} />
          </Section>
        )}

        {/* Address */}
        {addr && (
          <Section title="Address">
            <KV label="Permanent Address" value={addr.permanent_address} />
            <KV label="Present Address" value={addr.present_address} />
            <KV label="Present Division" value={addr.present_division} />
            <KV label="Present Zilla" value={addr.present_zilla} />
            <KV label="Present Upzilla" value={addr.present_upzilla} />
            <KV label="Grown Up" value={addr.grown_up} />
          </Section>
        )}

        {/* Education */}
        {edu && (
          <Section title="Education">
            <KV label="Medium" value={edu.education_medium} />
            <KV label="Highest Level" value={edu.highest_edu_level} />
            <KV label="Others" value={edu.others_edu} />
          </Section>
        )}

        {/* Family */}
        {fam && (
          <Section title="Family Status">
            <KV label="Father Status" value={fam.father_status} />
            <KV label="Mother Status" value={fam.mother_status} />
            <KV label="Father Occupation" value={fam.father_occupation} />
            <KV label="Mother Occupation" value={fam.mother_occupation} />
            <KV label="Brothers" value={fam.brothers} />
            <KV label="Sisters" value={fam.sisters} />
            <KV label="Financial Status" value={fam.financial_status} />
          </Section>
        )}

        {/* Occupation */}
        {occ && (
          <Section title="Occupation">
            <KV label="Occupations" value={occ.occupation?.join(', ')} />
            <KV label="Details" value={occ.occupation_details} />
            <KV label="Monthly Income" value={occ.monthly_income ? `৳${occ.monthly_income}` : ''} />
          </Section>
        )}

        {/* Personal */}
        {personal && (
          <Section title="Personal Info">
            <KV label="About" value={personal.about_me} />
            <KV label="Hobbies" value={personal.hobbies} />
          </Section>
        )}

        {/* Marital Info */}
        {marital && (
          <Section title="Marital Info">
            <KV label="Details" value={JSON.stringify(marital, null, 2)} pre />
          </Section>
        )}

        {/* Expected Partner */}
        {partner && (
          <Section title="Expected Life Partner">
            <KV label="Expected Age" value={partner.expected_age} />
            <KV label="Expected Height" value={partner.expected_height} />
            <KV label="Expected Edu" value={partner.expected_edu_qualification?.join(', ')} />
            <KV label="Expected District" value={partner.expected_zilla?.join(', ')} />
            <KV label="Expected Qualities" value={partner.expected_qualities} />
          </Section>
        )}

        {/* Pledge */}
        {pledge && (
          <Section title="Ongikar Nama (Pledge)">
            <KV label="Name" value={pledge.guardian_name} />
            <KV label="Agreement" value={pledge.agreement} />
          </Section>
        )}
      </div>
    </ModalShell>
  )
}

/* ── Helper components ───────────────────────────────── */
const ModalShell: React.FC<{ onClose: () => void; title: string; children: React.ReactNode }> = ({ onClose, title, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="fixed inset-0 bg-black/50" onClick={onClose} />
    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><XMarkIcon className="h-5 w-5" /></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
)

const Section: React.FC<{ title: string; children: React.ReactNode; accent?: boolean }> = ({ title, children, accent }) => (
  <div className={`rounded-lg border ${accent ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
    <h3 className={`px-4 py-2 text-sm font-semibold ${accent ? 'text-green-800 bg-green-100' : 'text-gray-700 bg-gray-50'} rounded-t-lg`}>{title}</h3>
    <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2">{children}</div>
  </div>
)

const KV: React.FC<{ label: string; value?: string | number | null; pre?: boolean }> = ({ label, value, pre }) => {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="col-span-1">
      <dt className="text-xs text-gray-500">{label}</dt>
      {pre ? <dd className="text-sm text-gray-900 whitespace-pre-wrap font-mono text-xs">{value}</dd> : <dd className="text-sm font-medium text-gray-900">{value}</dd>}
    </div>
  )
}

/* ── Biodatas Page ─────────────────────────────────────── */
const Biodatas: React.FC = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [bioTypeFilter, setBioTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const limit = 20
  const [viewUserId, setViewUserId] = useState<number | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string; userId?: number } | null>(null)

  const debouncedSearch = useDebounce(search, 400)

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['biodatas', { bio_type: bioTypeFilter, page, limit, search: debouncedSearch }],
    queryFn: () => biodataService.getBiodatas({ bio_type: bioTypeFilter, page, limit, search: debouncedSearch }),
  })

  const biodatas: Biodata[] = res?.data?.biodatas || res?.data || []
  const pagination = res?.data?.pagination

  // Mutations
  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => biodataService.updateStatus(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['biodatas'] }); toast.success('Status updated') },
    onError: () => toast.error('Failed to update status'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => biodataService.deleteBiodata(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['biodatas'] }); toast.success('Biodata deleted') },
    onError: () => toast.error('Failed to delete'),
  })

  const executeAction = () => {
    if (!confirmAction) return
    const { id, deleteId, action } = confirmAction as any
    if (action === 'delete') deleteMut.mutate(deleteId || id)
    else statusMut.mutate({ id, status: action })
    setConfirmAction(null)
  }

  const calcAge = (dob: string) => {
    const today = new Date()
    const bd = new Date(dob)
    let age = today.getFullYear() - bd.getFullYear()
    if (today.getMonth() < bd.getMonth() || (today.getMonth() === bd.getMonth() && today.getDate() < bd.getDate())) age--
    return age
  }

  const statusColor = (s?: string) => {
    if (!s) return 'bg-gray-100 text-gray-700'
    const m: Record<string, string> = { approved: 'bg-green-100 text-green-800', active: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800', banned: 'bg-red-100 text-red-800', blocked: 'bg-orange-100 text-orange-800', pending: 'bg-yellow-100 text-yellow-800', 'in review': 'bg-blue-100 text-blue-800', inactive: 'bg-gray-100 text-gray-700' }
    return m[s.toLowerCase()] || 'bg-gray-100 text-gray-700'
  }

  if (isLoading) return <div className="flex justify-center py-24"><ArrowPathIcon className="h-10 w-10 animate-spin text-blue-500" /></div>
  if (error) return <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-700">Error loading biodatas</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Biodatas</h1>
        <p className="mt-1 text-gray-500">Approve, reject, ban, delete and view biodatas with contact info</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user ID..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={bioTypeFilter} onChange={e => { setBioTypeFilter(e.target.value); setPage(1) }}>
          <option value="all">All Types</option>
          <option value="পাত্রের বায়োডাটা">পাত্রের বায়োডাটা</option>
          <option value="পাত্রীর বায়োডাটা">পাত্রীর বায়োডাটা</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bio Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {biodatas.map((b) => (
                <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-gray-900">{b.user_id ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${b.bio_type?.includes('পাত্র') && !b.bio_type?.includes('পাত্রী') ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>{b.bio_type || b.gender}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>Age: {calcAge(b.date_of_birth)} · {b.marital_status}</div>
                    <div className="text-xs text-gray-500">{b.blood_group} · {b.height}cm · {b.weight}kg</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>{b.zilla || '—'}</div>
                    <div className="text-xs text-gray-500">{b.upzilla || ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColor(b.user_status)}`}>{b.user_status || 'N/A'}</span>
                    {b.biodata_status === 'pending' && (
                      <span className="ml-1 inline-flex px-2 py-0.5 text-xs font-bold rounded-full bg-amber-200 text-amber-800 animate-pulse">📝 EDIT PENDING</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    <div>👁 {b.views_count || 0} · ❤ {b.likes_count || 0}</div>
                    <div>🛒 {b.purchases_count || 0}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{b.createdAt ? format(new Date(b.createdAt), 'dd MMM yy') : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {b.user_id && (
                        <button onClick={() => setViewUserId(b.user_id!)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="View Details">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      )}
                      {/* Activate — sets user_status: 'active' */}
                      <button
                        onClick={() => setConfirmAction({ id: b._id, action: 'active', userId: b.user_id } as any)}
                        className="p-1.5 rounded hover:bg-green-50 text-green-600"
                        title="Activate"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                      </button>
                      {/* Deactivate — sets user_status: 'inactive' */}
                      <button
                        onClick={() => setConfirmAction({ id: b._id, action: 'inactive', userId: b.user_id } as any)}
                        className="p-1.5 rounded hover:bg-yellow-50 text-yellow-600"
                        title="Deactivate"
                      >
                        <XCircleIcon className="h-4 w-4" />
                      </button>
                      {/* Ban — sets user_status: 'banned' */}
                      <button
                        onClick={() => setConfirmAction({ id: b._id, action: 'banned', userId: b.user_id } as any)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-600"
                        title="Ban"
                      >
                        <NoSymbolIcon className="h-4 w-4" />
                      </button>
                      {/* Delete — removes GeneralInfo document */}
                      <button
                        onClick={() => setConfirmAction({ id: b._id, deleteId: b.generalInfo_id || b._id, action: 'delete', userId: b.user_id } as any)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-700"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {biodatas.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No biodatas found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm">
            <span className="text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages} · {pagination.totalItems} total
            </span>
            <div className="flex gap-2">
              <button disabled={!pagination.hasPrev} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border rounded-md disabled:opacity-40 hover:bg-white"><ChevronLeftIcon className="h-4 w-4" /></button>
              <button disabled={!pagination.hasNext} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border rounded-md disabled:opacity-40 hover:bg-white"><ChevronRightIcon className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setConfirmAction(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Confirm Action</h3>
            {(() => {
              const ACTION_LABELS: Record<string, string> = {
                active: 'Activate',
                inactive: 'Deactivate',
                banned: 'Ban',
                delete: 'Delete',
              }
              const ACTION_COLORS: Record<string, string> = {
                active: 'bg-green-600 hover:bg-green-700',
                inactive: 'bg-yellow-600 hover:bg-yellow-700',
                banned: 'bg-red-600 hover:bg-red-700',
                delete: 'bg-red-700 hover:bg-red-800',
              }
              const label = ACTION_LABELS[confirmAction.action] ?? confirmAction.action
              const color = ACTION_COLORS[confirmAction.action] ?? 'bg-gray-600 hover:bg-gray-700'
              return (
                <>
                  <p className="text-gray-600 mb-4">
                    Are you sure you want to <span className="font-semibold text-gray-900">{label.toLowerCase()}</span> biodata
                    {(confirmAction as any).userId ? ` #${(confirmAction as any).userId}` : ''}?
                  </p>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setConfirmAction(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                    <button onClick={executeAction} className={`px-4 py-2 rounded-lg text-white ${color}`}>{label}</button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Detail modal */}
      {viewUserId && <BiodataDetailModal userId={viewUserId} onClose={() => setViewUserId(null)} />}
    </div>
  )
}

/* ── useDebounce hook ─────────────────────────────────── */
function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default Biodatas
