import React, { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { ArrowPathIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { FeaturedRequest, FeaturedSettings, featuredRequestService } from '../services/featuredRequestService'

const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500'
const errorMessage = (error: any, fallback: string) => error?.response?.data?.message || fallback
const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}
const TABS = ['pending', 'approved', 'rejected', 'all']

// TODO: admin-set price, duration and on/off switch for paid featuring.
const SettingsCard: React.FC = () => {
  const queryClient = useQueryClient()
  const { data } = useQuery({ queryKey: ['featured-settings'], queryFn: featuredRequestService.getSettings })
  const [form, setForm] = useState<FeaturedSettings | null>(null)
  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  const save = useMutation({
    mutationFn: featuredRequestService.updateSettings,
    onSuccess: (saved) => {
      queryClient.setQueryData(['featured-settings'], saved)
      toast.success('Featured settings saved')
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to save settings')),
  })

  if (!form) return <div className="rounded-xl bg-white p-6 text-gray-500 shadow">Loading settings...</div>

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        save.mutate(form)
      }}
      className="rounded-xl bg-white p-6 shadow"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Pricing</h2>
          <p className="mt-1 text-sm text-gray-500">What members pay (bKash) to be featured on the homepage, and for how long.</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          Accept new requests
        </label>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Price (৳)</label>
          <input
            required
            type="number"
            min={1}
            max={100000}
            step={1}
            className={inputClass}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Featured for (days)</label>
          <input
            required
            type="number"
            min={1}
            max={365}
            step={1}
            className={inputClass}
            value={form.duration_days}
            onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })}
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={save.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {save.isPending && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
            Save pricing
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-500">Changes apply to new payments only; requests already paid keep their price and duration.</p>
    </form>
  )
}

type Review = { request: FeaturedRequest; action: 'approve' | 'reject' }

const ReviewDialog: React.FC<{ review: Review; onClose: () => void }> = ({ review, onClose }) => {
  const queryClient = useQueryClient()
  const [note, setNote] = useState('')
  const [refund, setRefund] = useState(true)
  const { request, action } = review
  const approve = action === 'approve'

  const submit = useMutation({
    mutationFn: () =>
      approve ? featuredRequestService.approve(request._id, note) : featuredRequestService.reject(request._id, note, refund),
    onSuccess: () => {
      toast.success(approve ? 'Biodata is now featured' : refund ? 'Request rejected and refunded' : 'Request rejected')
      queryClient.invalidateQueries({ queryKey: ['featured-requests'] })
      onClose()
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Action failed'))
      queryClient.invalidateQueries({ queryKey: ['featured-requests'] })
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">
          {approve ? 'Approve featured request' : 'Reject featured request'}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Biodata #{request.bio_user_id ?? '—'} · ৳{request.amount} · {request.duration_days} days
        </p>
        {approve && (
          <p className="mt-3 rounded-md bg-green-50 p-3 text-sm text-green-800">
            The biodata will show on the homepage for {request.duration_days} days from now (added on top of any time left).
          </p>
        )}
        <label className="mt-4 block text-sm font-medium text-gray-700">
          {approve ? 'Note (optional)' : 'Reason shown to the member'}
        </label>
        <textarea
          rows={3}
          maxLength={500}
          className={inputClass}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={approve ? '' : 'e.g. Photos do not follow the guidelines'}
        />
        {!approve && (
          <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={refund} onChange={(e) => setRefund(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
            Refund ৳{request.amount} to the member's bKash
          </label>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => submit.mutate()}
            disabled={submit.isPending}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm text-white disabled:opacity-50 ${approve ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {submit.isPending && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
            {approve ? 'Approve & feature' : refund ? 'Reject & refund' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}

const FeaturedRequests: React.FC = () => {
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [review, setReview] = useState<Review | null>(null)
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['featured-requests', status, page],
    queryFn: () => featuredRequestService.list(status, page),
  })
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Featured Requests</h1>
        <p className="mt-1 text-gray-500">Members pay to have their biodata featured on the homepage. Approve to feature it, or reject and refund.</p>
      </div>

      <SettingsCard />

      <div className="rounded-xl bg-white shadow">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setStatus(tab)
                  setPage(1)
                }}
                className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${status === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {tab}
                {tab === 'pending' && data?.pending ? ` (${data.pending})` : ''}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => refetch()} className="rounded-md p-2 text-gray-500 hover:bg-gray-100" aria-label="Refresh">
            <ArrowPathIcon className={`h-5 w-5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {isLoading ? (
          <p className="p-6 text-gray-500">Loading...</p>
        ) : isError ? (
          <p className="p-6 text-red-600">Failed to load requests.</p>
        ) : !data?.data.length ? (
          <p className="p-6 text-gray-500">No {status === 'all' ? '' : status} requests.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Biodata</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">TrxID</th>
                  <th className="px-4 py-3">Requested</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map((item) => (
                  <tr key={item._id} className="align-top">
                    <td className="px-4 py-3 font-semibold text-gray-900">#{item.bio_user_id ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{item.email}</td>
                    <td className="px-4 py-3 text-gray-700">
                      ৳{item.amount}
                      <div className="text-xs text-gray-500">{item.duration_days} days</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{item.transaction_id || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[item.status]}`}>{item.status}</span>
                      {item.status === 'approved' && (
                        <div className="mt-1 text-xs text-gray-500">
                          Until {formatDate(item.featured_until)}
                          {item.biodata && !item.biodata.isFeatured && ' (expired)'}
                        </div>
                      )}
                      {item.status === 'rejected' && (
                        <div className="mt-1 max-w-[14rem] text-xs text-gray-500">
                          {item.refunded ? 'Refunded. ' : 'Not refunded. '}
                          {item.admin_note}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setReview({ request: item, action: 'approve' })}
                            className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                          >
                            <CheckIcon className="h-4 w-4" /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setReview({ request: item, action: 'reject' })}
                            className="inline-flex items-center gap-1 rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                          >
                            <XMarkIcon className="h-4 w-4" /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-3 text-sm">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border px-3 py-1 disabled:opacity-40">
              Previous
            </button>
            <span className="text-gray-600">
              Page {page} of {pages}
            </span>
            <button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded border px-3 py-1 disabled:opacity-40">
              Next
            </button>
          </div>
        )}
      </div>

      {review && <ReviewDialog review={review} onClose={() => setReview(null)} />}
    </div>
  )
}

export default FeaturedRequests
