import React, { useState } from 'react'
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, ArrowPathIcon, EyeIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentService, Payment } from '../services/paymentService'
import { toast } from 'react-toastify'
import { XMarkIcon } from '@heroicons/react/24/outline'

const Payments: React.FC = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const limit = 20
  const [detailPayment, setDetailPayment] = useState<Payment | null>(null)

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['payments', { search, status: statusFilter, page, limit }],
    queryFn: () => paymentService.getPayments({ search, status: statusFilter, page, limit }),
  })

  const payments: Payment[] = res?.data?.payments || res?.data || []
  const pagination = res?.data?.pagination

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => paymentService.updatePaymentStatus(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payments'] }); toast.success('Payment status updated') },
    onError: () => toast.error('Failed to update payment status'),
  })

  const statusBadge = (s: string) => {
    const m: Record<string, string> = { Completed: 'bg-green-100 text-green-800', Pending: 'bg-yellow-100 text-yellow-800', Refunded: 'bg-blue-100 text-blue-800', failed: 'bg-red-100 text-red-800' }
    return m[s] || 'bg-gray-100 text-gray-700'
  }

  const totalRevenue = payments.reduce((sum, p) => p.status === 'Completed' ? sum + (p.amount || 0) : sum, 0)

  if (isLoading) return <div className="flex justify-center py-24"><ArrowPathIcon className="h-10 w-10 animate-spin text-blue-500" /></div>
  if (error) return <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-700">Error loading payments</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        <p className="mt-1 text-gray-500">All bKash payment transactions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Payments', value: pagination?.totalItems || payments.length },
          { label: 'Revenue', value: `৳${totalRevenue.toLocaleString()}` },
          { label: 'Completed', value: payments.filter(p => p.status === 'Completed').length },
          { label: 'Pending', value: payments.filter(p => p.status === 'Pending').length },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg shadow p-4">
            <div className="text-xs text-gray-500">{s.label}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Search by transaction ID or user..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="all">All Status</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
          <option value="Refunded">Refunded</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map(p => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{p.transaction_id || '—'}</td>
                  <td className="px-4 py-3 text-sm">{typeof p.user === 'string' ? p.user.slice(-6) : '—'}</td>
                  <td className="px-4 py-3 text-sm font-semibold">৳{(p.amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">{p.points || 0}</td>
                  <td className="px-4 py-3 text-sm">{p.method || 'bKash'}</td>
                  <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusBadge(p.status)}`}>{p.status}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.createdAt ? format(new Date(p.createdAt), 'dd MMM yy HH:mm') : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setDetailPayment(p)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><EyeIcon className="h-4 w-4" /></button>
                      {p.status === 'Pending' && (
                        <button onClick={() => statusMut.mutate({ id: p._id, status: 'Completed' })} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100">Complete</button>
                      )}
                      {p.status === 'Completed' && (
                        <button onClick={() => statusMut.mutate({ id: p._id, status: 'Refunded' })} className="text-xs px-2 py-1 bg-orange-50 text-orange-700 rounded hover:bg-orange-100">Refund</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-gray-400">No payments found</td></tr>}
            </tbody>
          </table>
        </div>

        {pagination && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm">
            <span className="text-gray-600">Page {pagination.currentPage} of {pagination.totalPages} · {pagination.totalItems} total</span>
            <div className="flex gap-2">
              <button disabled={!pagination.hasPrev} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border rounded-md disabled:opacity-40 hover:bg-white"><ChevronLeftIcon className="h-4 w-4" /></button>
              <button disabled={!pagination.hasNext} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border rounded-md disabled:opacity-40 hover:bg-white"><ChevronRightIcon className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detailPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDetailPayment(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Payment Details</h3>
              <button onClick={() => setDetailPayment(null)} className="p-1 hover:bg-gray-100 rounded"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <Row label="Transaction ID" value={detailPayment.transaction_id} />
              <Row label="Amount" value={`৳${(detailPayment.amount || 0).toLocaleString()}`} />
              <Row label="Points" value={detailPayment.points} />
              <Row label="Method" value={detailPayment.method || 'bKash'} />
              <Row label="Type" value={detailPayment.type || 'package'} />
              <Row label="Status" value={detailPayment.status} />
              <Row label="Bio ID" value={detailPayment.bio_id} />
              <Row label="User" value={detailPayment.user} />
              <Row label="Created" value={detailPayment.createdAt ? format(new Date(detailPayment.createdAt), 'dd MMM yyyy HH:mm') : '—'} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const Row: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-900">{value ?? '—'}</span>
  </div>
)

export default Payments
