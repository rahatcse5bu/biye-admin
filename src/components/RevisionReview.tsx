import React, { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowPathIcon,
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { biodataRevisionService, FieldChangeKind, RevisionField, RevisionStatus } from '../services/biodataRevisionService'

const SITE_URL = 'https://www.bibaho.org'

export const statusStyle: Record<RevisionStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-600',
}

const kindStyle: Record<FieldChangeKind, { label: string; className: string }> = {
  added: { label: 'নতুন', className: 'bg-green-100 text-green-800' },
  changed: { label: 'পরিবর্তিত', className: 'bg-blue-100 text-blue-800' },
  removed: { label: 'মুছে ফেলা', className: 'bg-red-100 text-red-700' },
}

// TODO: reasons are sent to the member as written, so they stay in Bengali.
const QUICK_REASONS = [
  'ছবি স্পষ্ট নয় বা নিয়ম অনুযায়ী নয়',
  'লেখার মধ্যে যোগাযোগের তথ্য (ফোন/ইমেইল/লিংক) দেওয়া যাবে না',
  'অশালীন বা অনুপযুক্ত তথ্য',
  'তথ্য অসম্পূর্ণ',
  'তথ্য ভুল বা আগের তথ্যের সাথে অসামঞ্জস্যপূর্ণ',
]

export const formatDate = (value?: string | null) => (value ? format(new Date(value), 'dd MMM yyyy, HH:mm') : '—')

const isEmpty = (value: unknown) =>
  value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)

const isImageUrl = (value: unknown): value is string =>
  typeof value === 'string' && /^https?:\/\/\S+\.(jpe?g|png|webp|gif|avif)(\?\S*)?$/i.test(value)

const scalarText = (value: unknown): string => {
  if (typeof value === 'boolean') return value ? 'হ্যাঁ' : 'না'
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return format(new Date(value), 'dd MMM yyyy')
  if (value && typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

type Token = { type: 'same' | 'add' | 'del'; text: string }

// TODO: word-level LCS diff so edits inside long answers stand out; falls back to whole-text swap when too large.
const wordDiff = (before: string, after: string): Token[] => {
  const a = before.split(/(\s+)/).filter(Boolean)
  const b = after.split(/(\s+)/).filter(Boolean)
  if (a.length * b.length > 250_000) return [{ type: 'del', text: before }, { type: 'add', text: after }]
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const out: Token[] = []
  let i = 0
  let j = 0
  const push = (type: Token['type'], text: string) => {
    const last = out[out.length - 1]
    if (last?.type === type) last.text += text
    else out.push({ type, text })
  }
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push('same', a[i])
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) push('del', a[i++])
    else push('add', b[j++])
  }
  while (i < a.length) push('del', a[i++])
  while (j < b.length) push('add', b[j++])
  return out
}

const Empty = () => <span className="italic text-gray-400">ফাঁকা</span>

const TextDiff: React.FC<{ before: string; after: string }> = ({ before, after }) => (
  <p className="whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-3 leading-7 text-gray-800">
    {wordDiff(before, after).map((token, index) =>
      token.type === 'same' ? (
        <span key={index}>{token.text}</span>
      ) : token.type === 'add' ? (
        <ins key={index} className="rounded bg-green-100 px-0.5 text-green-900 no-underline">{token.text}</ins>
      ) : (
        <del key={index} className="rounded bg-red-100 px-0.5 text-red-800">{token.text}</del>
      ),
    )}
  </p>
)

const PhotoCompare: React.FC<{ before: string[]; after: string[] }> = ({ before, after }) => {
  const removed = before.filter((url) => !after.includes(url))
  const photo = (url: string, tag?: { text: string; className: string }, faded = false) => (
    <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="relative block">
      <img src={url} alt="" loading="lazy" className={`h-28 w-28 rounded-lg border object-cover ${faded ? 'opacity-50 ring-2 ring-red-400' : ''}`} />
      {tag && <span className={`absolute left-1 top-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${tag.className}`}>{tag.text}</span>}
    </a>
  )
  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase text-gray-500">After approval ({after.length})</p>
        <div className="flex flex-wrap gap-3">
          {after.length ? after.map((url) => photo(url, before.includes(url) ? undefined : { text: 'NEW', className: 'bg-green-600 text-white' })) : <Empty />}
        </div>
      </div>
      {removed.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase text-red-600">Will be removed ({removed.length})</p>
          <div className="flex flex-wrap gap-3">{removed.map((url) => photo(url, { text: 'REMOVED', className: 'bg-red-600 text-white' }, true))}</div>
        </div>
      )}
    </div>
  )
}

const ListCompare: React.FC<{ before: unknown[]; after: unknown[] }> = ({ before, after }) => {
  const b = before.map(scalarText)
  const a = after.map(scalarText)
  const items = [...a.map((text) => ({ text, kind: b.includes(text) ? 'same' : 'add' })), ...b.filter((t) => !a.includes(t)).map((text) => ({ text, kind: 'del' }))]
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, index) => (
        <span
          key={index}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            item.kind === 'add' ? 'bg-green-100 text-green-800' : item.kind === 'del' ? 'bg-red-100 text-red-700 line-through' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {item.kind === 'add' ? '+ ' : item.kind === 'del' ? '− ' : ''}
          {item.text}
        </span>
      ))}
    </div>
  )
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

// TODO: labels for keys inside list items (achievements, working history); unknown keys show raw.
const ITEM_KEY_LABELS: Record<string, string> = {
  title: 'শিরোনাম',
  year: 'সাল',
  description: 'বিবরণ',
  company_name: 'প্রতিষ্ঠান',
  designation: 'পদবি',
  start_date: 'শুরু',
  end_date: 'শেষ',
  is_current: 'বর্তমানে কর্মরত',
  job_description: 'কাজের বিবরণ',
}

const itemTone = {
  add: { tag: 'নতুন', card: 'border-green-300 bg-green-50/60', badge: 'bg-green-600 text-white' },
  del: { tag: 'মুছে ফেলা হবে', card: 'border-red-300 bg-red-50/60 opacity-75', badge: 'bg-red-600 text-white' },
  same: { tag: '', card: 'border-gray-200 bg-white', badge: '' },
} as const

const ObjectListCompare: React.FC<{ before: Record<string, unknown>[]; after: Record<string, unknown>[] }> = ({ before, after }) => {
  const key = (item: Record<string, unknown>) => JSON.stringify(item)
  const b = before.map(key)
  const a = after.map(key)
  const items = [
    ...after.map((item, i) => ({ item, kind: b.includes(a[i]) ? 'same' : 'add' }) as const),
    ...before.filter((_, i) => !a.includes(b[i])).map((item) => ({ item, kind: 'del' }) as const),
  ]
  if (!items.length) return <Empty />
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map(({ item, kind }, index) => {
        const tone = itemTone[kind]
        const entries = Object.entries(item).filter(([, v]) => !isEmpty(v))
        return (
          <div key={index} className={`rounded-lg border p-3 text-sm ${tone.card}`}>
            {tone.tag && <span className={`mb-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${tone.badge}`}>{tone.tag}</span>}
            <dl className={`space-y-1 ${kind === 'del' ? 'line-through decoration-red-300' : ''}`}>
              {entries.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[7rem_1fr] gap-2">
                  <dt className="text-xs text-gray-500">{ITEM_KEY_LABELS[k] || k}</dt>
                  <dd className="whitespace-pre-wrap break-words text-gray-900">{scalarText(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )
      })}
    </div>
  )
}

// TODO: picks the comparison that makes the change easiest to judge for this kind of value.
const FieldCompare: React.FC<{ row: RevisionField }> = ({ row }) => {
  const { before, after } = row
  const asArray = (v: unknown) => (Array.isArray(v) ? v : isEmpty(v) ? [] : [v])
  if ([...asArray(before), ...asArray(after)].some(isImageUrl)) {
    return <PhotoCompare before={asArray(before).filter(isImageUrl)} after={asArray(after).filter(isImageUrl)} />
  }
  const all = [...asArray(before), ...asArray(after)]
  if (all.length && all.every(isPlainObject)) {
    return <ObjectListCompare before={asArray(before)} after={asArray(after)} />
  }
  if (Array.isArray(before) || Array.isArray(after)) return <ListCompare before={asArray(before)} after={asArray(after)} />
  const b = isEmpty(before) ? '' : scalarText(before)
  const a = isEmpty(after) ? '' : scalarText(after)
  if (b && a && (b.length > 60 || a.length > 60)) return <TextDiff before={b} after={a} />
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="rounded-md bg-red-50 px-2 py-1 text-red-800 line-through decoration-red-300">{b || <Empty />}</span>
      <ArrowRightIcon className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
      <span className="rounded-md bg-green-50 px-2 py-1 font-medium text-green-900">{a || <Empty />}</span>
    </div>
  )
}

const rowId = (sectionKey: string, field: string) => `change-${sectionKey}-${field}`

export const RevisionReview: React.FC<{ id: string; onClose: () => void }> = ({ id, onClose }) => {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['biodata-revisions', 'detail', id],
    queryFn: () => biodataRevisionService.detail(id),
  })

  const stats = useMemo(() => {
    const fields = data?.sections.flatMap((s) => s.fields.map((f) => ({ ...f, sectionKey: s.key, sectionLabel: s.label }))) || []
    return {
      total: fields.length,
      added: fields.filter((f) => f.kind === 'added').length,
      changed: fields.filter((f) => f.kind === 'changed').length,
      removed: fields.filter((f) => f.kind === 'removed').length,
      flagged: fields.filter((f) => f.warnings.length > 0),
    }
  }, [data])

  // TODO: one prefix refreshes the list, this panel and the sidebar badge.
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['biodata-revisions'] })
  const handleError = (err: any) => {
    if (err?.response?.status === 409) {
      toast.warn('The member edited this request after you opened it. Showing the latest version.')
      refetch()
    } else toast.error(err?.response?.data?.error || err?.response?.data?.message || 'Action failed')
  }

  const approveMut = useMutation({
    mutationFn: () => biodataRevisionService.approve(id, data!.updatedAt),
    onSuccess: () => {
      toast.success('Changes approved and published')
      refresh()
      onClose()
    },
    onError: handleError,
  })

  const rejectMut = useMutation({
    mutationFn: () => biodataRevisionService.reject(id, reason.trim(), data!.updatedAt),
    onSuccess: () => {
      toast.success('Changes rejected')
      refresh()
      onClose()
    },
    onError: handleError,
  })

  const busy = approveMut.isPending || rejectMut.isPending
  const jumpTo = (sectionKey: string, field: string) => {
    setCollapsed((c) => ({ ...c, [sectionKey]: false }))
    requestAnimationFrame(() => document.getElementById(rowId(sectionKey, field))?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }
  const addReason = (text: string) => setReason((current) => (current.includes(text) ? current : current ? `${current}\n${text}` : text))

  // TODO: portal to <body> so a transformed layout ancestor can't clip the fixed overlay.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/40" role="dialog" aria-modal="true" aria-labelledby="review-title" onClick={onClose}>
      <div className="flex h-full w-full max-w-6xl flex-col bg-gray-50 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between gap-4 border-b bg-white px-6 py-4">
          <div className="min-w-0">
            <h2 id="review-title" className="truncate text-lg font-bold text-gray-900">
              Biodata #{data?.user?.user_id ?? '…'} — change request
            </h2>
            {data && (
              <p className="mt-0.5 text-sm text-gray-500">
                Submitted {formatDate(data.submitted_at)}
                {data.status !== 'pending' && (
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusStyle[data.status]}`}>{data.status}</span>
                )}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-green-700" />
          </div>
        ) : error || !data ? (
          <div className="m-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">Could not load this change request</div>
        ) : (
          <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_320px]">
            <main className="min-h-0 space-y-4 overflow-y-auto p-6">
              {stats.flagged.length > 0 && (
                <section className="rounded-xl border border-amber-300 bg-amber-50 p-4" aria-labelledby="attention-title">
                  <h3 id="attention-title" className="flex items-center gap-2 font-bold text-amber-900">
                    <ExclamationTriangleIcon className="h-5 w-5" />
                    Needs attention ({stats.flagged.length})
                  </h3>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {stats.flagged.map((f) => (
                      <li key={`${f.sectionKey}.${f.field}`}>
                        <button type="button" onClick={() => jumpTo(f.sectionKey, f.field)} className="text-left text-amber-900 hover:underline">
                          <span className="font-semibold">{f.sectionLabel} › {f.label}:</span> {f.warnings.join(' · ')}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {data.sections.map((section) => {
                const isCollapsed = collapsed[section.key]
                const flagged = section.fields.filter((f) => f.warnings.length).length
                return (
                  <section key={section.key} className="overflow-hidden rounded-xl border bg-white">
                    <button
                      type="button"
                      onClick={() => setCollapsed((c) => ({ ...c, [section.key]: !c[section.key] }))}
                      aria-expanded={!isCollapsed}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50"
                    >
                      <span className="font-bold text-gray-900">{section.label}</span>
                      <span className="flex items-center gap-2 text-xs">
                        {flagged > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">{flagged} flagged</span>}
                        <span className="text-gray-500">{section.fields.length} change(s)</span>
                        <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                      </span>
                    </button>
                    {!isCollapsed && (
                      <ul className="divide-y border-t">
                        {section.fields.map((row) => (
                          <li
                            key={row.field}
                            id={rowId(section.key, row.field)}
                            className={`scroll-mt-24 px-4 py-4 ${row.warnings.length ? 'border-l-4 border-l-amber-400 bg-amber-50/40' : ''}`}
                          >
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-gray-900">{row.label}</span>
                              <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${kindStyle[row.kind].className}`}>{kindStyle[row.kind].label}</span>
                              <code className="text-[11px] text-gray-400">{row.field}</code>
                            </div>
                            <FieldCompare row={row} />
                            {row.warnings.length > 0 && (
                              <p className="mt-2 flex items-start gap-1.5 text-sm font-medium text-amber-800">
                                <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                                {row.warnings.join(' · ')}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )
              })}
            </main>

            <aside className="flex min-h-0 flex-col border-t bg-white lg:border-l lg:border-t-0">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              <section className="flex items-center gap-3">
                {data.member.photo ? (
                  <img src={data.member.photo} alt="" className="h-14 w-14 rounded-xl border object-cover" />
                ) : (
                  <UserCircleIcon className="h-14 w-14 text-gray-300" />
                )}
                <div className="min-w-0 text-sm">
                  <p className="font-bold text-gray-900">#{data.user?.user_id} · {data.member.bio_type || '—'}</p>
                  <p className="truncate text-gray-500">{data.user?.email}</p>
                  <p className="text-xs text-gray-400">
                    {[data.member.gender, data.member.religion, data.user?.user_status].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </section>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                {data.user?.user_id && (
                  <a href={`${SITE_URL}/biodata/${data.user.user_id}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-green-800 hover:underline">
                    View live biodata ↗
                  </a>
                )}
                {data.member.joined_at && <span className="text-gray-400">Joined {format(new Date(data.member.joined_at), 'dd MMM yyyy')}</span>}
              </div>

              <section className="rounded-xl border p-4">
                <h3 className="text-sm font-bold text-gray-900">Summary</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {stats.total} field(s) in {data.sections.length} section(s)
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-green-50 py-2 text-green-800"><div className="text-lg font-bold">{stats.added}</div>new</div>
                  <div className="rounded-lg bg-blue-50 py-2 text-blue-800"><div className="text-lg font-bold">{stats.changed}</div>changed</div>
                  <div className="rounded-lg bg-red-50 py-2 text-red-700"><div className="text-lg font-bold">{stats.removed}</div>removed</div>
                </div>
                {stats.flagged.length > 0 && (
                  <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-amber-800">
                    <ExclamationTriangleIcon className="h-4 w-4" /> {stats.flagged.length} need attention
                  </p>
                )}
              </section>

              <section className="rounded-xl border p-4">
                <h3 className="text-sm font-bold text-gray-900">Earlier requests</h3>
                {data.history.length === 0 ? (
                  <p className="mt-1 text-sm text-gray-500">This is the member's first change request.</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-sm">
                    {data.history.map((h) => (
                      <li key={h._id}>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${statusStyle[h.status]}`}>{h.status}</span>
                        <span className="ml-2 text-xs text-gray-500">{formatDate(h.decided_at)} · {h.field_count} field(s)</span>
                        {h.admin_note && <p className="mt-0.5 text-xs text-gray-600">“{h.admin_note}”</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              </div>

              {/* TODO: pinned below the scrolling context so approve/reject never leaves the screen. */}
              <div className="border-t bg-gray-50 p-4">
              {data.status !== 'pending' ? (
                <section className={`rounded-xl p-4 text-sm ${statusStyle[data.status]}`}>
                  <p className="font-semibold capitalize">{data.status} {data.reviewed_at && `on ${formatDate(data.reviewed_at)}`}</p>
                  {data.reviewed_by?.email && <p>by {data.reviewed_by.email}</p>}
                  {data.admin_note && <p className="mt-1">Reason: {data.admin_note}</p>}
                </section>
              ) : rejecting ? (
                <section className="space-y-3 rounded-xl border border-red-200 p-4">
                  <h3 className="text-sm font-bold text-red-700">Reject — reason for the member</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_REASONS.map((text) => (
                      <button key={text} type="button" onClick={() => addReason(text)} className="rounded-full border px-2.5 py-1 text-left text-xs text-gray-700 hover:bg-gray-50">
                        + {text}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    aria-label="Rejection reason"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-red-500"
                    placeholder="কেন অনুমোদন করা হলো না…"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setRejecting(false)} disabled={busy} className="flex-1 rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectMut.mutate()}
                      disabled={busy || !reason.trim()}
                      className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {rejectMut.isPending ? 'Rejecting…' : 'Send rejection'}
                    </button>
                  </div>
                </section>
              ) : (
                <section className="space-y-2 rounded-xl border p-4">
                  <h3 className="text-sm font-bold text-gray-900">Decision</h3>
                  <p className="text-xs text-gray-500">Approving publishes every change above at once. The member is notified either way.</p>
                  <button
                    type="button"
                    onClick={() => approveMut.mutate()}
                    disabled={busy}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-green-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-50"
                  >
                    <CheckIcon className="h-4 w-4" />
                    {approveMut.isPending ? 'Approving…' : 'Approve & publish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejecting(true)}
                    disabled={busy}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Reject…
                  </button>
                </section>
              )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

export default RevisionReview
