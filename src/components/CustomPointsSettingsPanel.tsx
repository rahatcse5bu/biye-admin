import React, { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { pointsPackageService } from '../services/pointsPackageService'

const inputClass =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500'

const CustomPointsSettingsPanel: React.FC = () => {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['custom-points-settings'],
    queryFn: pointsPackageService.getCustomSettings,
  })
  const [form, setForm] = useState({ enabled: true, rate: '', min: '', max: '' })

  useEffect(() => {
    if (!data) return
    setForm({
      enabled: data.enabled,
      rate: String(data.points_per_taka),
      min: String(data.min_amount),
      max: String(data.max_amount),
    })
  }, [data])

  const saveMutation = useMutation({
    mutationFn: () =>
      pointsPackageService.updateCustomSettings({
        enabled: form.enabled,
        points_per_taka: Number(form.rate),
        min_amount: Number(form.min),
        max_amount: Number(form.max),
      }),
    onSuccess: (saved) => {
      queryClient.setQueryData(['custom-points-settings'], saved)
      toast.success('Custom amount settings saved')
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'Failed to save settings'),
  })

  const rate = Number(form.rate)
  const exampleAmount = Number(form.min) || 100
  const examplePoints = Number.isFinite(rate) && rate > 0 ? Math.floor(exampleAmount * rate + 1e-9) : null

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        saveMutation.mutate()
      }}
      className="rounded-xl bg-white p-6 shadow"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Custom amount</h2>
          <p className="mt-1 text-sm text-gray-500">
            Lets users type their own amount on the points page. Amounts equal to a package price still get that package's points.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300"
            disabled={isLoading || isError}
          />
          Show on website
        </label>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-gray-500">
          <ArrowPathIcon className="h-5 w-5 animate-spin" /> Loading settings...
        </div>
      ) : isError ? (
        <div className="py-6 text-red-600">Failed to load custom amount settings.</div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Points per ৳1</label>
              <input required type="number" min={0.01} step="any" className={inputClass} value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Minimum amount (৳)</label>
              <input required type="number" min={1} step={1} className={inputClass} value={form.min} onChange={(e) => setForm({ ...form, min: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Maximum amount (৳)</label>
              <input required type="number" min={1} step={1} className={inputClass} value={form.max} onChange={(e) => setForm({ ...form, max: e.target.value })} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              {examplePoints !== null
                ? `Example: ৳${exampleAmount} gives ${examplePoints} points (rounded down).`
                : 'Enter a rate greater than 0.'}
            </p>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saveMutation.isPending && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
              Save Settings
            </button>
          </div>
        </>
      )}
    </form>
  )
}

export default CustomPointsSettingsPanel
