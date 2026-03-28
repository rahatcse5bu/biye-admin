import React, { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { contactPurchaseService, ContactPurchase } from '../services/contactPurchaseService'

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const ContactPurchases: React.FC = () => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const limit = 20

  const debouncedSearch = useDebounce(search, 400)

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['contact-purchases', { page, limit, search: debouncedSearch }],
    queryFn: () => contactPurchaseService.getAll({ page, limit, search: debouncedSearch }),
  })

  const items: ContactPurchase[] = res?.data || []
  const totalPages = res?.totalPages || 1
  const totalItems = res?.totalItems || items.length

  if (isLoading) return <div className="flex justify-center py-24"><ArrowPathIcon className="h-10 w-10 animate-spin text-blue-500" /></div>
  if (error) return <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-700">Error loading contact purchases</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contact Purchases</h1>
        <p className="mt-1 text-gray-500">{totalItems} total purchases — 70 points per purchase</p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Search by email or user ID..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bio User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bio User Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(cp => (
                <tr key={cp._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <div className="font-semibold">#{cp.userDetails?.user_id}</div>
                    <div className="text-xs text-gray-500">{cp.userDetails?.email}</div>
                    <div className="text-xs text-gray-400">Points: {cp.userDetails?.points}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {cp.userContact ? (
                      <>
                        <div>{cp.userContact.full_name}</div>
                        <div className="text-xs text-gray-500">{cp.userContact.relation} · {cp.userContact.family_number}</div>
                      </>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="font-semibold">#{cp.bioUserDetails?.user_id}</div>
                    <div className="text-xs text-gray-500">{cp.bioUserDetails?.email}</div>
                    <div className="text-xs text-gray-400">Points: {cp.bioUserDetails?.points}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {cp.bioUserContact ? (
                      <>
                        <div>{cp.bioUserContact.full_name}</div>
                        <div className="text-xs text-gray-500">{cp.bioUserContact.relation} · {cp.bioUserContact.family_number}</div>
                      </>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{cp.createdAt ? format(new Date(cp.createdAt), 'dd MMM yy HH:mm') : '—'}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-gray-400">No purchases found</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm">
          <span className="text-gray-600">Page {page} of {totalPages} · {totalItems} total</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border rounded-md disabled:opacity-40 hover:bg-white"><ChevronLeftIcon className="h-4 w-4" /></button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border rounded-md disabled:opacity-40 hover:bg-white"><ChevronRightIcon className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPurchases
