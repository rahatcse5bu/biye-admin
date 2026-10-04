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
  UserGroupIcon,
  CheckBadgeIcon,
  ClockIcon,
  HeartIcon,
  ShoppingBagIcon,
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
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm text-gray-400">Loading biodata details...</p>
      </div>
    </ModalShell>
  )

  if (error || !data) return (
    <ModalShell onClose={onClose} title={`Biodata #${userId}`}>
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="p-4 bg-red-50 rounded-full">
          <XMarkIcon className="h-8 w-8 text-red-400" />
        </div>
        <p className="text-sm text-red-600">Failed to load biodata details.</p>
        <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 underline">Close</button>
      </div>
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
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {/* Pending Changes Review Banner */}
        {g?.biodata_status === 'pending' && g?.pending_changes && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <DocumentDuplicateIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-900">Pending Changes Review</h3>
                <p className="text-xs text-amber-600">Version {(g.version || 1) + 1} — Awaiting admin approval</p>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-200 text-amber-800 animate-pulse">
                NEEDS REVIEW
              </span>
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
                return <p className="text-sm text-amber-700 italic pl-1">কোনো পরিবর্তিত ক্ষেত্র পাওয়া যায়নি।</p>
              }
              return (
                <div className="rounded-lg border border-amber-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-amber-100/50">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-amber-700 uppercase w-1/4">ক্ষেত্র</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-red-600 uppercase w-[37.5%]">বর্তমান</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-green-700 uppercase w-[37.5%]">পরিবর্তন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100">
                      {changedKeys.map(key => {
                        const approvedVal = approved[key]
                        const isNew = !(key in approved) || approvedVal === undefined || approvedVal === null
                        const label = FIELD_LABELS[key] ?? key.replace(/_/g, ' ')
                        return (
                          <tr key={key} className="bg-white/50">
                            <td className="px-3 py-2 font-medium text-gray-700 align-top">{label}</td>
                            <td className="px-3 py-2 align-top">
                              {isNew
                                ? <span className="inline-flex px-2 py-0.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-md">নতুন</span>
                                : <span className="block break-words text-red-700 bg-red-50 px-2 py-0.5 rounded-md text-xs">{fmtVal(approvedVal)}</span>
                              }
                            </td>
                            <td className="px-3 py-2 align-top">
                              <span className="block break-words text-green-800 bg-green-50 px-2 py-0.5 rounded-md text-xs">{fmtVal(pending[key])}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            })()}
            <div className="flex gap-3">
              <button
                onClick={() => approveMut.mutate(g._id)}
                disabled={approveMut.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm disabled:opacity-50 transition-colors"
              >
                <CheckCircleIcon className="h-4 w-4" />
                {approveMut.isPending ? 'Approving...' : 'Approve & Publish'}
              </button>
              {!showRejectInput ? (
                <button
                  onClick={() => setShowRejectInput(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors"
                >
                  <XCircleIcon className="h-4 w-4" />
                  Reject Changes
                </button>
              ) : (
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection..."
                    className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => rejectMut.mutate({ id: g._id, reason: rejectReason })}
                      disabled={rejectMut.isPending}
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                    >
                      {rejectMut.isPending ? 'Rejecting...' : 'Confirm'}
                    </button>
                    <button onClick={() => { setShowRejectInput(false); setRejectReason('') }} className="px-4 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rejected note */}
        {g?.biodata_status === 'rejected' && g?.admin_note && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-red-100 rounded-lg mt-0.5">
                <XCircleIcon className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-800">Rejection Reason</p>
                <p className="text-sm text-red-600 mt-0.5">{g.admin_note}</p>
              </div>
            </div>
          </div>
        )}

        {/* Version info */}
        {g?.version && g.version > 1 && (
          <div className="flex items-center gap-3 px-1">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Version {g.version}</span>
            {g.last_approved_at && (
              <span className="text-xs text-gray-400">Last approved {format(new Date(g.last_approved_at), 'dd MMM yy HH:mm')}</span>
            )}
          </div>
        )}

        {/* Contact Info — Highlighted */}
        {contact && (
          <Section title="Guardian / Contact Info" icon={<UserGroupIcon className="h-4 w-4" />} accent>
            <KV label="Guardian Name" value={contact.full_name} />
            <KV label="Relation" value={contact.relation} />
            <KV label="Phone Number" value={contact.family_number} />
            <KV label="Email" value={contact.bio_receiving_email} />
          </Section>
        )}

        {/* General */}
        {g && (
          <Section title="General Info" icon={<CheckBadgeIcon className="h-4 w-4" />}>
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
          <Section title="Address" icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>}>
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
          <Section title="Education" icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>}>
            <KV label="Medium" value={edu.education_medium} />
            <KV label="Highest Level" value={edu.highest_edu_level} />
            <KV label="Others" value={edu.others_edu} />
          </Section>
        )}

        {/* Family */}
        {fam && (
          <Section title="Family Status" icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>}>
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
          <Section title="Occupation" icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" /></svg>}>
            <KV label="Occupations" value={occ.occupation?.join(', ')} />
            <KV label="Details" value={occ.occupation_details} />
            <KV label="Monthly Income" value={occ.monthly_income ? `৳${occ.monthly_income.toLocaleString()}` : ''} />
          </Section>
        )}

        {/* Personal */}
        {personal && (
          <Section title="Personal Info" icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>}>
            <KV label="About" value={personal.about_me} />
            <KV label="Hobbies" value={personal.hobbies} />
          </Section>
        )}

        {/* Marital Info */}
        {marital && (
          <Section title="Marital Info" icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>}>
            <KV label="Details" value={JSON.stringify(marital, null, 2)} pre />
          </Section>
        )}

        {/* Expected Partner */}
        {partner && (
          <Section title="Expected Life Partner" icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>}>
            <KV label="Expected Age" value={partner.expected_age} />
            <KV label="Expected Height" value={partner.expected_height} />
            <KV label="Expected Edu" value={partner.expected_edu_qualification?.join(', ')} />
            <KV label="Expected District" value={partner.expected_zilla?.join(', ')} />
            <KV label="Expected Qualities" value={partner.expected_qualities} />
          </Section>
        )}

        {/* Pledge */}
        {pledge && (
          <Section title="Ongikar Nama (Pledge)" icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}>
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <XMarkIcon className="h-5 w-5 text-gray-500" />
        </button>
      </div>
      <div className="p-6 overflow-y-auto flex-1">{children}</div>
    </div>
  </div>
)

const Section: React.FC<{ title: string; children: React.ReactNode; icon?: React.ReactNode; accent?: boolean }> = ({ title, children, icon, accent }) => (
  <div className={`rounded-xl border ${accent ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100 bg-white'} overflow-hidden`}>
    <h3 className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold ${accent ? 'text-emerald-800 bg-emerald-100/50' : 'text-gray-700 bg-gray-50/80'} border-b ${accent ? 'border-emerald-200/50' : 'border-gray-100'}`}>
      {icon && <span className={accent ? 'text-emerald-500' : 'text-gray-400'}>{icon}</span>}
      {title}
    </h3>
    <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2.5">{children}</div>
  </div>
)

const KV: React.FC<{ label: string; value?: string | number | null; pre?: boolean }> = ({ label, value, pre }) => {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="col-span-1">
      <dt className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{label}</dt>
      {pre
        ? <dd className="text-sm text-gray-900 whitespace-pre-wrap font-mono text-xs bg-gray-50 rounded-lg p-2 mt-1">{value}</dd>
        : <dd className="text-sm font-medium text-gray-800 mt-0.5">{value}</dd>
      }
    </div>
  )
}

/* ── Biodatas Page ─────────────────────────────────────── */
const Biodatas: React.FC = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [bioTypeFilter, setBioTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const limit = 20
  const [viewUserId, setViewUserId] = useState<number | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string; userId?: number; deleteId?: string } | null>(null)

  const debouncedSearch = useDebounce(search, 400)

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['biodatas', { bio_type: bioTypeFilter, status: statusFilter, page, limit, search: debouncedSearch }],
    queryFn: () => biodataService.getBiodatas({ bio_type: bioTypeFilter, search: debouncedSearch, page, limit }),
  })

  const biodatas: Biodata[] = res?.data?.biodatas || []
  const pagination = res?.data?.pagination

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
    const { id, deleteId, action } = confirmAction
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

  const statusBadgeClass = (s?: string) => {
    if (!s) return 'bg-gray-100 text-gray-600'
    const m: Record<string, string> = {
      approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      rejected: 'bg-red-50 text-red-700 border border-red-200',
      banned: 'bg-red-50 text-red-700 border border-red-200',
      blocked: 'bg-orange-50 text-orange-700 border border-orange-200',
      pending: 'bg-amber-50 text-amber-700 border border-amber-200',
      'in review': 'bg-blue-50 text-blue-700 border border-blue-200',
      inactive: 'bg-gray-50 text-gray-600 border border-gray-200',
    }
    return m[s.toLowerCase()] || 'bg-gray-50 text-gray-600 border border-gray-200'
  }

  const bioTypeBadge = (bioType?: string) => {
    if (!bioType) return 'bg-gray-100 text-gray-600'
    return bioType.includes('পাত্র') && !bioType.includes('পাত্রী')
      ? 'bg-blue-50 text-blue-700 border border-blue-200'
      : 'bg-pink-50 text-pink-700 border border-pink-200'
  }

  const clearFilters = () => {
    setSearch('')
    setBioTypeFilter('all')
    setStatusFilter('all')
    setPage(1)
  }

  const hasActiveFilters = search || bioTypeFilter !== 'all' || statusFilter !== 'all'

  // Compute stats from current data
  const totalItems = pagination?.totalItems || biodatas.length
  const pendingCount = biodatas.filter(b => b.biodata_status === 'pending').length
  const approvedCount = biodatas.filter(b => b.biodata_status === 'approved' || b.user_status === 'active').length
  const bannedCount = biodatas.filter(b => b.user_status === 'banned').length

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <ArrowPathIcon className="h-10 w-10 animate-spin text-indigo-500" />
      <p className="text-sm text-gray-400">Loading biodatas...</p>
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-center">
      <XMarkIcon className="h-8 w-8 text-red-400 mx-auto mb-2" />
      <p className="text-red-700 font-medium">Error loading biodatas</p>
      <button onClick={() => queryClient.invalidateQueries({ queryKey: ['biodatas'] })} className="mt-3 text-sm text-red-600 hover:text-red-800 underline">Retry</button>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Biodatas</h1>
        <p className="mt-1 text-gray-500">Approve, reject, manage and view biodatas with contact info</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Biodatas', value: totalItems, icon: <UserGroupIcon className="h-5 w-5" />, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Active', value: approvedCount, icon: <CheckBadgeIcon className="h-5 w-5" />, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Pending Review', value: pendingCount, icon: <ClockIcon className="h-5 w-5" />, color: 'text-amber-600 bg-amber-50' },
          { label: 'Banned', value: bannedCount, icon: <NoSymbolIcon className="h-5 w-5" />, color: 'text-red-600 bg-red-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user ID..."
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50 transition-colors"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          {/* Bio Type Filter */}
          <select
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm min-w-[160px] bg-gray-50/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            value={bioTypeFilter}
            onChange={e => { setBioTypeFilter(e.target.value); setPage(1) }}
          >
            <option value="all">All Types</option>
            <option value="পাত্রের বায়োডাটা">পাত্রের বায়োডাটা</option>
            <option value="পাত্রীর বায়োডাটা">পাত্রীর বায়োডাটা</option>
          </select>

          {/* Status Filter */}
          <select
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm min-w-[140px] bg-gray-50/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="banned">Banned</option>
            <option value="pending">Pending</option>
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 text-sm">
            {search && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                Search: "{search}"
                <button onClick={() => setSearch('')} className="hover:text-indigo-900"><XMarkIcon className="h-3 w-3" /></button>
              </span>
            )}
            {bioTypeFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                {bioTypeFilter}
                <button onClick={() => setBioTypeFilter('all')} className="hover:text-blue-900"><XMarkIcon className="h-3 w-3" /></button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter('all')} className="hover:text-green-900"><XMarkIcon className="h-3 w-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bio Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stats</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {biodatas.map((b) => (
                <tr key={b._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono font-bold text-indigo-600">{b.user_id ?? '—'}</span>
                    {b.version && b.version > 1 && (
                      <span className="ml-1 text-[10px] text-gray-400">v{b.version}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${bioTypeBadge(b.bio_type)}`}>
                      {b.bio_type || b.gender || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {b.date_of_birth ? `${calcAge(b.date_of_birth)} yrs` : '—'} · {b.marital_status || '—'}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {b.blood_group || '—'} · {b.height ? `${b.height}cm` : '—'} · {b.weight ? `${b.weight}kg` : '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">{b.zilla || '—'}</div>
                    <div className="text-xs text-gray-500">{b.upzilla || ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex w-fit px-2 py-0.5 text-[11px] font-semibold rounded-md ${statusBadgeClass(b.user_status)}`}>
                        {b.user_status || 'N/A'}
                      </span>
                      {b.biodata_status === 'pending' && (
                        <span className="inline-flex w-fit px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-100 text-amber-700 border border-amber-200 animate-pulse">
                          EDIT PENDING
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1" title="Views">
                        <EyeIcon className="h-3.5 w-3.5 text-gray-400" />
                        {b.views_count || 0}
                      </span>
                      <span className="flex items-center gap-1" title="Likes">
                        <HeartIcon className="h-3.5 w-3.5 text-gray-400" />
                        {b.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1" title="Purchases">
                        <ShoppingBagIcon className="h-3.5 w-3.5 text-gray-400" />
                        {b.purchases_count || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {b.createdAt ? format(new Date(b.createdAt), 'dd MMM yy') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      {b.user_id && (
                        <button
                          onClick={() => setViewUserId(b.user_id!)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmAction({ id: b._id, action: 'active', userId: b.user_id })}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                        title="Activate"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirmAction({ id: b._id, action: 'inactive', userId: b.user_id })}
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                        title="Deactivate"
                      >
                        <XCircleIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirmAction({ id: b._id, action: 'banned', userId: b.user_id })}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                        title="Ban"
                      >
                        <NoSymbolIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirmAction({ id: b._id, deleteId: b.generalInfo_id || b._id, action: 'delete', userId: b.user_id })}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-700 transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {biodatas.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-gray-100 rounded-full">
                        <MagnifyingGlassIcon className="h-8 w-8 text-gray-300" />
                      </div>
                      <p className="text-gray-400 font-medium">No biodatas found</p>
                      {hasActiveFilters && (
                        <button onClick={clearFilters} className="text-sm text-indigo-600 hover:text-indigo-800 underline">Clear filters</button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalItems > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <span className="text-sm text-gray-500">
              Page <span className="font-semibold text-gray-700">{pagination.currentPage}</span> of <span className="font-semibold text-gray-700">{pagination.totalPages}</span> · <span className="font-semibold text-gray-700">{pagination.totalItems}</span> total
            </span>
            <div className="flex gap-2">
              <button
                disabled={!pagination.hasPrev}
                onClick={() => setPage(p => p - 1)}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-white transition-colors"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                disabled={!pagination.hasNext}
                onClick={() => setPage(p => p + 1)}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-white transition-colors"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmAction(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            {(() => {
              const ACTION_LABELS: Record<string, string> = {
                active: 'Activate',
                inactive: 'Deactivate',
                banned: 'Ban',
                delete: 'Delete',
              }
              const ACTION_COLORS: Record<string, string> = {
                active: 'bg-emerald-600 hover:bg-emerald-700',
                inactive: 'bg-amber-600 hover:bg-amber-700',
                banned: 'bg-red-600 hover:bg-red-700',
                delete: 'bg-red-700 hover:bg-red-800',
              }
              const ACTION_ICONS: Record<string, React.ReactNode> = {
                active: <CheckCircleIcon className="h-4 w-4" />,
                inactive: <XCircleIcon className="h-4 w-4" />,
                banned: <NoSymbolIcon className="h-4 w-4" />,
                delete: <TrashIcon className="h-4 w-4" />,
              }
              const label = ACTION_LABELS[confirmAction.action] ?? confirmAction.action
              const color = ACTION_COLORS[confirmAction.action] ?? 'bg-gray-600 hover:bg-gray-700'
              const icon = ACTION_ICONS[confirmAction.action]
              return (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-xl ${confirmAction.action === 'delete' ? 'bg-red-50' : confirmAction.action === 'banned' ? 'bg-red-50' : confirmAction.action === 'inactive' ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                      <span className={confirmAction.action === 'delete' ? 'text-red-600' : confirmAction.action === 'banned' ? 'text-red-600' : confirmAction.action === 'inactive' ? 'text-amber-600' : 'text-emerald-600'}>
                        {icon}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Confirm {label}</h3>
                  </div>
                  <p className="text-gray-600 mb-6 text-sm">
                    Are you sure you want to <span className="font-semibold text-gray-900">{label.toLowerCase()}</span> biodata
                    {confirmAction.userId ? ` #${confirmAction.userId}` : ''}?
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setConfirmAction(null)}
                      className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={executeAction}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white ${color} transition-colors`}
                    >
                      {icon}
                      {label}
                    </button>
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
