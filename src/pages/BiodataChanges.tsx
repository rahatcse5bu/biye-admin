import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowPathIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { biodataRevisionService, RevisionStatus, RevisionSummary } from '../services/biodataRevisionService'
import RevisionReview, { formatDate, statusStyle } from '../components/RevisionReview'
import Pagination from '../components/Pagination'

const tabs: { label: string; value: RevisionStatus }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Withdrawn', value: 'withdrawn' },
]

const BiodataChanges: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [status, setStatus] = useState<RevisionStatus>('pending')
  const [page, setPage] = useState(1)
  const openId = searchParams.get('id')
  const limit = 20

  const { data: res, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['biodata-revisions', 'list', { status, page }],
    queryFn: () => biodataRevisionService.list({ status, page, limit }),
  })

  const items: RevisionSummary[] = res?.data || []
  const totalPages = res?.totalPages || 1

  const open = (id: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (id) next.set('id', id)
    else next.delete('id')
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Biodata Changes</h1>
          <p className="mt-1 text-gray-500">Edits to published biodatas. Nothing goes live until you approve it.</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowPathIcon className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-lg bg-white p-4 shadow" role="tablist" aria-label="Filter by status">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={status === tab.value}
            onClick={() => {
              setStatus(tab.value)
              setPage(1)
            }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              status === tab.value ? 'bg-green-800 text-white' : 'text-gray-600 hover:bg-green-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <ArrowPathIcon className="h-10 w-10 animate-spin text-green-700" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">Error loading change requests</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl bg-white py-16 text-center shadow">
          <ClipboardDocumentCheckIcon className="h-12 w-12 text-gray-300" />
          <p className="mt-3 font-medium text-gray-600">No {status} change requests</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Biodata</th>
                <th className="px-4 py-3">Changed sections</th>
                <th className="px-4 py-3">Fields</th>
                <th className="px-4 py-3">{status === 'pending' ? 'Submitted' : 'Reviewed'}</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {items.map((item) => (
                <tr key={item._id} className="cursor-pointer hover:bg-gray-50" onClick={() => open(item._id)}>
                  <td className="px-4 py-3">
                    <div className="font-semibold">#{item.user?.user_id ?? '—'}</div>
                    <div className="text-xs text-gray-500">{item.user?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{item.sections.join(', ')}</td>
                  <td className="px-4 py-3">{item.field_count}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(status === 'pending' ? item.submitted_at : item.reviewed_at || item.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusStyle[item.status]}`}>{item.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" className="rounded-lg bg-green-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-900">
                      {item.status === 'pending' ? 'Review' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} totalItems={res?.total ?? 0} pageSize={limit} onPageChange={setPage} />
        </div>
      )}

      {openId && <RevisionReview key={openId} id={openId} onClose={() => open(null)} />}
    </div>
  )
}

export default BiodataChanges
