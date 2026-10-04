import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { format } from 'date-fns'
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { RefundRequest, refundService } from '../services/refundService'
import { useConfirm } from './ConfirmDialog'

const statusStyles: Record<RefundRequest['status'], string> = {
  requested: 'bg-amber-100 text-amber-800',
  refunded: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
}

const errorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || fallback

const RefundRequestsPanel: React.FC = () => {
  const queryClient = useQueryClient()
  const confirm = useConfirm()
  const [status, setStatus] = useState('requested')
  const [rejecting, setRejecting] = useState<RefundRequest | null>(null)
  const [note, setNote] = useState('')

  const { data: requests = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['refund-requests', status],
    queryFn: () => refundService.listRequests(status),
    refetchInterval: 60_000,
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['refund-requests'] })
    queryClient.invalidateQueries({ queryKey: ['payments'] })
  }

  const approveMut = useMutation({
    mutationFn: (id: string) => refundService.approveRequest(id),
    onSuccess: (result) => {
      toast.success(`Refunded via bKash (Refund TrxID: ${result?.data?.refundTrxID})`)
      refresh()
    },
    onError: (error) => toast.error(errorMessage(error, 'Refund failed')),
  })

  const rejectMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => refundService.rejectRequest(id, note),
    onSuccess: () => {
      toast.success('Request rejected and points returned to the user')
      setRejecting(null)
      refresh()
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to reject request')),
  })

  const handleApprove = async (item: RefundRequest) => {
    const ok = await confirm({
      title: `Refund ৳${item.refund_amount}?`,
      message: (
        <>
          <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 rounded-lg bg-gray-50 p-3 text-gray-700">
            <dt className="font-medium">Customer</dt>
            <dd className="break-all">{item.email}</dd>
            <dt className="font-medium">TrxID</dt>
            <dd className="break-all font-mono text-xs leading-5">{item.transaction_id}</dd>
            <dt className="font-medium">Paid / refund</dt>
            <dd>৳{item.paid_amount} / ৳{item.refund_amount}</dd>
          </dl>
          <p className="mt-3">
            The money is sent back through bKash. The user's {item.points_held} points were already held when they requested. This cannot be undone.
          </p>
        </>
      ),
      confirmLabel: 'Refund',
    })
    if (ok) approveMut.mutate(item._id)
  }

  const openReject = (item: RefundRequest) => {
    setNote('')
    setRejecting(item)
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Refund Requests</h2>
          <p className="text-sm text-gray-500">Requests sent by users from their payment history.</p>
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="requested">Pending</option>
          <option value="refunded">Refunded</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
          <ArrowPathIcon className="h-5 w-5 animate-spin" /> Loading requests...
        </div>
      ) : isError ? (
        <div className="py-10 text-center text-red-600">
          Failed to load refund requests.{' '}
          <button onClick={() => refetch()} className="underline">Retry</button>
        </div>
      ) : requests.length === 0 ? (
        <div className="py-10 text-center text-gray-500">No refund requests.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2">Requested</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">TrxID</th>
                <th className="px-3 py-2">Paid</th>
                <th className="px-3 py-2">Refund</th>
                <th className="px-3 py-2">Points held</th>
                <th className="px-3 py-2">Reason</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((item) => {
                const busy =
                  (approveMut.isPending && approveMut.variables === item._id) ||
                  (rejectMut.isPending && rejectMut.variables?.id === item._id)
                return (
                  <tr key={item._id}>
                    <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                      {format(new Date(item.createdAt), 'dd MMM yyyy, HH:mm')}
                    </td>
                    <td className="px-3 py-2">{item.email}</td>
                    <td className="px-3 py-2 font-mono text-xs">{item.transaction_id}</td>
                    <td className="px-3 py-2">৳{item.paid_amount}</td>
                    <td className="px-3 py-2 font-semibold">৳{item.refund_amount}</td>
                    <td className="px-3 py-2">{item.points_held}</td>
                    <td className="max-w-[16rem] px-3 py-2 text-gray-600">{item.reason || '—'}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusStyles[item.status]}`}>
                        {item.status}
                      </span>
                      {item.refund_trx_id && (
                        <div className="mt-1 font-mono text-[11px] text-gray-500">{item.refund_trx_id}</div>
                      )}
                      {item.admin_note && (
                        <div className="mt-1 text-[11px] text-gray-500">Note: {item.admin_note}</div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {item.status === 'requested' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(item)}
                            disabled={busy}
                            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            {approveMut.isPending && approveMut.variables === item._id ? 'Refunding...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => openReject(item)}
                            disabled={busy}
                            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {rejecting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setRejecting(null)} />
          <form
            onSubmit={(e) => {
              e.preventDefault()
              rejectMut.mutate({ id: rejecting._id, note })
            }}
            className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Reject refund request?</h3>
              <button type="button" onClick={() => setRejecting(null)} className="rounded p-1 hover:bg-gray-100" aria-label="Close">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              {rejecting.email} gets their {rejecting.points_held} held points back. The note below is sent to them.
            </p>
            <textarea
              rows={3}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason (optional)"
              className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setRejecting(null)} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="submit"
                disabled={rejectMut.isPending}
                className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {rejectMut.isPending && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                Reject
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default RefundRequestsPanel
