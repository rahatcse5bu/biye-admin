import React, { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService, User } from '../services/userService'
import { toast } from 'react-toastify'

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const Users: React.FC = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [page, setPage] = useState(1)
  const limit = 20

  const debouncedSearch = useDebounce(search, 400)

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['users', { search: debouncedSearch, status: statusFilter, user_type: roleFilter, page, limit }],
    queryFn: () => userService.getUsers({ search: debouncedSearch, status: statusFilter, user_type: roleFilter, page, limit }),
  })

  const users: User[] = res?.data?.users || []
  const pagination = res?.data?.pagination

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => userService.updateUserStatus(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('User status updated') },
    onError: () => toast.error('Failed to update user status'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('User deleted') },
    onError: () => toast.error('Failed to delete user'),
  })

  const statusBadge = (s: string) => {
    const m: Record<string, string> = { active: 'bg-green-100 text-green-800', inactive: 'bg-gray-100 text-gray-700', banned: 'bg-red-100 text-red-800', pending: 'bg-yellow-100 text-yellow-800', 'in review': 'bg-blue-100 text-blue-800' }
    return m[s] || 'bg-gray-100 text-gray-700'
  }

  const roleBadge = (r: string) => r === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setRoleFilter('all')
    setPage(1)
  }

  const hasActiveFilters = search || statusFilter !== 'all' || roleFilter !== 'all'

  if (isLoading) return <div className="flex justify-center py-24"><ArrowPathIcon className="h-10 w-10 animate-spin text-blue-500" /></div>
  if (error) return <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-700">Error loading users</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <p className="mt-1 text-gray-500">Manage platform users — {pagination?.totalItems || users.length} total</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: pagination?.totalItems || users.length, color: 'blue' },
          { label: 'Active', value: users.filter(u => u.user_status === 'active').length, color: 'green' },
          { label: 'Pending', value: users.filter(u => u.user_status === 'pending').length, color: 'yellow' },
          { label: 'In Review', value: users.filter(u => u.user_status === 'in review').length, color: 'indigo' },
          { label: 'Banned', value: users.filter(u => u.user_status === 'banned').length, color: 'red' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg shadow p-4">
            <div className="text-xs text-gray-500">{s.label}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email, user ID, or name..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          {/* Status Filter */}
          <select
            className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[140px]"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="in review">In Review</option>
            <option value="banned">Banned</option>
          </select>

          {/* Role Filter */}
          <select
            className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[120px]"
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md border border-gray-300"
            >
              <XMarkIcon className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="text-gray-500">Filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                Search: "{search}"
                <button onClick={() => setSearch('')} className="hover:text-blue-900"><XMarkIcon className="h-3 w-3" /></button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter('all')} className="hover:text-green-900"><XMarkIcon className="h-3 w-3" /></button>
              </span>
            )}
            {roleFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">
                Role: {roleFilter}
                <button onClick={() => setRoleFilter('all')} className="hover:text-purple-900"><XMarkIcon className="h-3 w-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timeline</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono font-semibold">{u.user_id}</td>
                  <td className="px-4 py-3 text-sm">{u.email}</td>
                  <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${roleBadge(u.user_role)}`}>{u.user_role}</span></td>
                  <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusBadge(u.user_status)}`}>{u.user_status}</span></td>
                  <td className="px-4 py-3 text-sm">{u.points ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{u.edited_timeline_index ?? 0} / {u.last_edited_timeline_index ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.createdAt ? format(new Date(u.createdAt), 'dd MMM yy') : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {u.user_status !== 'active' && (
                        <button onClick={() => statusMut.mutate({ id: u._id, status: 'active' })} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100" title="Activate">Activate</button>
                      )}
                      {u.user_status !== 'banned' && (
                        <button onClick={() => statusMut.mutate({ id: u._id, status: 'banned' })} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100" title="Ban">Ban</button>
                      )}
                      {u.user_status === 'banned' && (
                        <button onClick={() => statusMut.mutate({ id: u._id, status: 'active' })} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100" title="Unban">Unban</button>
                      )}
                      <button onClick={() => { if (confirm('Delete this user?')) deleteMut.mutate(u._id) }} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100" title="Delete">Del</button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-gray-400">No users found</td></tr>}
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
    </div>
  )
}

export default Users
