import React, { useEffect, useMemo, useState } from 'react'
import { ArrowPathIcon, MagnifyingGlassIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useConfirm } from '../components/ConfirmDialog'
import { uploadsService, UploadItem, UploadStatus } from '../services/uploadsService'

const SITE_URL = 'https://www.bibaho.org'

const statusMeta: Record<UploadStatus, { label: string; className: string; hint: string }> = {
  live: { label: 'Live', className: 'bg-green-100 text-green-800', hint: 'Shown on the published biodata' },
  pending: { label: 'Pending review', className: 'bg-amber-100 text-amber-800', hint: 'Part of a change request not yet approved' },
  unused: { label: 'Unused', className: 'bg-gray-100 text-gray-600', hint: 'Not used by any biodata — safe to delete' },
}

const filters: { label: string; value: '' | UploadStatus }[] = [
  { label: 'All', value: '' },
  { label: 'Live', value: 'live' },
  { label: 'Pending review', value: 'pending' },
  { label: 'Unused', value: 'unused' },
]

const formatBytes = (bytes: number) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`)

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const Uploads: React.FC = () => {
  const queryClient = useQueryClient()
  const confirm = useConfirm()
  const [biodata, setBiodata] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | UploadStatus>('')
  const debouncedBiodata = useDebounce(biodata.replace(/\D/g, ''), 400)

  const { data, isLoading, isFetching, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey: ['uploads', debouncedBiodata],
    queryFn: ({ pageParam }) => uploadsService.list({ cursor: pageParam || undefined, biodata: debouncedBiodata || undefined }),
    initialPageParam: '',
    getNextPageParam: (last) => last.next_cursor || undefined,
  })

  const all: UploadItem[] = useMemo(() => data?.pages.flatMap((p) => p.data) || [], [data])
  const items = statusFilter ? all.filter((item) => item.status === statusFilter) : all
  const total = data?.pages[0]?.total ?? 0
  const counts = useMemo(
    () => all.reduce((acc, item) => ({ ...acc, [item.status]: (acc[item.status] || 0) + 1 }), {} as Record<string, number>),
    [all],
  )

  const deleteMut = useMutation({
    mutationFn: (item: UploadItem) => uploadsService.remove(item.public_id),
    onSuccess: (res) => {
      toast.success(res.removed_from_profile ? 'Photo deleted and removed from the biodata' : 'Photo deleted')
      queryClient.invalidateQueries({ queryKey: ['uploads'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete photo'),
  })

  const handleDelete = async (item: UploadItem) => {
    const ok = await confirm({
      title: 'Delete this photo?',
      message:
        item.status === 'live'
          ? `This photo is live on biodata #${item.owner?.user_id ?? '?'}. It will be removed from the profile and the member will be notified. This can't be undone.`
          : item.status === 'pending'
            ? 'This photo is part of a change request that is waiting for review. It will be removed from that request. This can’t be undone.'
            : 'This photo is not used by any biodata. It will be deleted permanently.',
      confirmLabel: 'Delete photo',
      tone: 'danger',
    })
    if (ok) deleteMut.mutate(item)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Uploads</h1>
          <p className="mt-1 text-gray-500">Profile photos members have uploaded, newest first{total ? ` · ${total} in total` : ''}.</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowPathIcon className={`h-4 w-4 ${isFetching && !isFetchingNextPage ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="search"
            inputMode="numeric"
            placeholder="Biodata no. (e.g. 2140)"
            className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-green-700 focus:ring-green-700"
            value={biodata}
            onChange={(e) => setBiodata(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
          {filters.map((f) => (
            <button
              key={f.label}
              type="button"
              role="tab"
              aria-selected={statusFilter === f.value}
              onClick={() => setStatusFilter(f.value)}
              title={f.value ? statusMeta[f.value].hint : undefined}
              className={`rounded-full px-3 py-1 text-sm font-medium ${statusFilter === f.value ? 'bg-green-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {f.label} · {f.value ? counts[f.value] || 0 : all.length}
            </button>
          ))}
        </div>
      </div>
      {hasNextPage && statusFilter && (
        <p className="-mt-3 text-xs text-gray-500">Counts cover the photos loaded so far. Load more to include older uploads.</p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-24">
          <ArrowPathIcon className="h-10 w-10 animate-spin text-green-700" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {(error as any)?.response?.data?.message || 'Error loading uploads'}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl bg-white py-16 text-center shadow">
          <PhotoIcon className="h-12 w-12 text-gray-300" />
          <p className="mt-3 font-medium text-gray-600">{debouncedBiodata ? 'No photos for this biodata' : 'No photos here'}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <li key={item.public_id} className="overflow-hidden rounded-xl bg-white shadow">
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="relative block aspect-square bg-gray-100">
                <img src={item.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
                <span
                  className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusMeta[item.status].className}`}
                  title={statusMeta[item.status].hint}
                >
                  {statusMeta[item.status].label}
                </span>
              </a>
              <div className="space-y-1 p-3 text-sm">
                {item.owner?.user_id ? (
                  <a href={`${SITE_URL}/biodata/${item.owner.user_id}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-green-800 hover:underline">
                    Biodata #{item.owner.user_id} ↗
                  </a>
                ) : (
                  <span className="font-semibold text-gray-400">Deleted account</span>
                )}
                <p className="truncate text-xs text-gray-500">{item.owner?.email}</p>
                <p className="text-xs text-gray-400">
                  {format(new Date(item.created_at), 'dd MMM yyyy')} · {formatBytes(item.bytes)} · {item.width}×{item.height}
                </p>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  disabled={deleteMut.isPending}
                  className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {hasNextPage && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}

export default Uploads
