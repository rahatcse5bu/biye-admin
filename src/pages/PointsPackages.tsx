import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import {
  ArrowPathIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import {
  PointsPackage,
  PointsPackageInput,
  pointsPackageService,
} from '../services/pointsPackageService'
import { useConfirm } from '../components/ConfirmDialog'

type FormState = {
  name: string
  price: string
  points: string
  features: string
  sort_order: string
  is_active: boolean
}

const emptyForm: FormState = {
  name: '',
  price: '',
  points: '',
  features: '',
  sort_order: '0',
  is_active: true,
}

const toForm = (item: PointsPackage): FormState => ({
  name: item.name,
  price: String(item.price),
  points: String(item.points),
  features: item.features.join('\n'),
  sort_order: String(item.sort_order),
  is_active: item.is_active,
})

const toInput = (form: FormState): PointsPackageInput => ({
  name: form.name.trim(),
  price: Number(form.price),
  points: Number(form.points),
  features: form.features.split('\n').map((line) => line.trim()).filter(Boolean),
  sort_order: Number(form.sort_order) || 0,
  is_active: form.is_active,
})

const errorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || fallback

const inputClass =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500'

const PointsPackages: React.FC = () => {
  const queryClient = useQueryClient()
  const confirm = useConfirm()
  const [editing, setEditing] = useState<PointsPackage | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)

  const { data: packages = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-points-packages'],
    queryFn: pointsPackageService.list,
  })

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['admin-points-packages'] })

  const saveMutation = useMutation({
    mutationFn: (input: PointsPackageInput) =>
      editing
        ? pointsPackageService.update(editing._id, input)
        : pointsPackageService.create(input),
    onSuccess: () => {
      toast.success(editing ? 'Package updated' : 'Package created')
      closeForm()
      refresh()
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to save package')),
  })

  const toggleMutation = useMutation({
    mutationFn: (item: PointsPackage) =>
      pointsPackageService.update(item._id, { is_active: !item.is_active }),
    onSuccess: refresh,
    onError: (error) => toast.error(errorMessage(error, 'Failed to update status')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pointsPackageService.remove(id),
    onSuccess: () => {
      toast.success('Package deleted')
      refresh()
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to delete package')),
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, sort_order: String(packages.length + 1) })
    setShowForm(true)
  }

  const openEdit = (item: PointsPackage) => {
    setEditing(item)
    setForm(toForm(item))
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    saveMutation.mutate(toInput(form))
  }

  const handleDelete = async (item: PointsPackage) => {
    const ok = await confirm({
      title: `Delete "${item.name}"?`,
      message: 'It will be removed from the website immediately. To hide it temporarily, set it to Hidden instead.',
      confirmLabel: 'Delete',
    })
    if (ok) deleteMutation.mutate(item._id)
  }

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Points Packages</h1>
          <p className="mt-1 text-gray-500">
            Packages shown on the website's points-package page. Buyers get the points of the package whose price matches the bKash amount.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          New Package
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-gray-500">
            <ArrowPathIcon className="h-5 w-5 animate-spin" /> Loading packages...
          </div>
        ) : isError ? (
          <div className="p-10 text-center text-red-600">
            Failed to load packages.{' '}
            <button onClick={() => refetch()} className="underline">Retry</button>
          </div>
        ) : packages.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No packages yet.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Price (BDT)</th>
                <th className="px-4 py-3">Points</th>
                <th className="px-4 py-3">Features</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {packages.map((item) => (
                <tr key={item._id} className={item.is_active ? '' : 'bg-gray-50 text-gray-400'}>
                  <td className="px-4 py-3">{item.sort_order}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3">৳{item.price}</td>
                  <td className="px-4 py-3">{item.points}</td>
                  <td className="px-4 py-3">
                    <ul className="list-disc space-y-0.5 pl-4">
                      {item.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleMutation.mutate(item)}
                      disabled={toggleMutation.isPending}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {item.is_active ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="rounded-md p-2 text-blue-600 hover:bg-blue-50"
                        aria-label={`Edit ${item.name}`}
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="rounded-md p-2 text-red-600 hover:bg-red-50"
                        aria-label={`Delete ${item.name}`}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleSubmit}
            className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? 'Edit Package' : 'New Package'}
              </h2>
              <button type="button" onClick={closeForm} className="rounded-md p-1 text-gray-500 hover:bg-gray-100" aria-label="Close">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input required className={inputClass} value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="বেসিক প্যাকেজ" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Price (BDT)</label>
                <input required type="number" min={1} className={inputClass} value={form.price} onChange={(e) => setField('price', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Points credited</label>
                <input required type="number" min={0} className={inputClass} value={form.points} onChange={(e) => setField('points', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Features (one per line)</label>
              <textarea
                rows={4}
                className={inputClass}
                value={form.features}
                onChange={(e) => setField('features', e.target.value)}
                placeholder={'সর্বোচ্চ ৩ বার বায়োডাটা শেয়ার\nসর্বোচ্চ ১ বার অভিভাবকের তথ্য'}
              />
              <p className="mt-1 text-xs text-gray-500">The points line is added automatically on the website.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Display order</label>
                <input type="number" className={inputClass} value={form.sort_order} onChange={(e) => setField('sort_order', e.target.value)} />
              </div>
              <label className="mt-6 flex items-center gap-2 text-sm font-medium text-gray-700">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setField('is_active', e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                Show on website
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={closeForm} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saveMutation.isPending && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                {editing ? 'Save Changes' : 'Create Package'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default PointsPackages
