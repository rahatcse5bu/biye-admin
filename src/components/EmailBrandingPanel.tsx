import React, { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { ArrowPathIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { EmailSettings, emailSettingsService } from '../services/emailSettingsService'
import defaultLogo from '../assets/email-logo.png'
import { useAuthStore } from '../store/authStore'

const inputClass =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500'

// TODO: Facebook, LinkedIn and WhatsApp render as round icons in the email footer; others as text.
const PRESETS = ['Facebook', 'LinkedIn', 'WhatsApp', 'YouTube', 'Instagram']

const errorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || fallback

const EmailBrandingPanel: React.FC = () => {
  const queryClient = useQueryClient()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['email-settings'],
    queryFn: emailSettingsService.get,
  })
  const { data: templates = [] } = useQuery({
    queryKey: ['email-templates'],
    queryFn: emailSettingsService.templates,
  })
  const [form, setForm] = useState<EmailSettings | null>(null)
  const [template, setTemplate] = useState('')
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewSubject, setPreviewSubject] = useState('')
  const [previewError, setPreviewError] = useState('')
  const [logoBroken, setLogoBroken] = useState(false)
  const adminEmail = useAuthStore((state) => state.user?.email) || ''
  const [testTo, setTestTo] = useState(adminEmail)

  // TODO: older backends omit the new fields; fill them so the form stays controlled.
  const normalize = (value: EmailSettings): EmailSettings => ({
    ...value,
    support_phone: value.support_phone ?? '',
    sender_name: value.sender_name || 'Bibaho',
    disabled_templates: value.disabled_templates || [],
  })

  useEffect(() => {
    if (data) setForm(normalize(data))
  }, [data])

  // TODO: debounced live preview of the chosen template built from the unsaved form.
  useEffect(() => {
    if (!form) return
    const timer = setTimeout(() => {
      emailSettingsService
        .preview(form, template || undefined)
        .then((result) => {
          setPreviewHtml(result.html)
          setPreviewSubject(result.subject)
          setPreviewError('')
        })
        .catch((error) => setPreviewError(errorMessage(error, 'Preview failed')))
    }, 500)
    return () => clearTimeout(timer)
  }, [form, template])

  const saveMut = useMutation({
    mutationFn: (value: EmailSettings) => emailSettingsService.update(value),
    onSuccess: (saved) => {
      queryClient.setQueryData(['email-settings'], saved)
      toast.success('Email branding saved. New emails use it within a minute.')
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to save email settings')),
  })

  const testMut = useMutation({
    mutationFn: () => emailSettingsService.sendTest(form!, testTo.trim(), template || undefined),
    onSuccess: (message) => toast.success(message),
    onError: (error) => toast.error(errorMessage(error, 'Test email failed'), { autoClose: 10000 }),
  })

  if (isLoading || !form) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-white p-6 text-gray-500 shadow">
        {isError ? (
          <span className="text-red-600">
            Failed to load email settings. <button onClick={() => refetch()} className="underline">Retry</button>
          </span>
        ) : (
          <>
            <ArrowPathIcon className="h-5 w-5 animate-spin" /> Loading email settings...
          </>
        )}
      </div>
    )
  }

  const setLink = (index: number, key: 'label' | 'url', value: string) =>
    setForm({
      ...form,
      social_links: form.social_links.map((link, i) => (i === index ? { ...link, [key]: value } : link)),
    })
  const addLink = (label = '') =>
    setForm({ ...form, social_links: [...form.social_links, { label, url: '' }] })
  const removeLink = (index: number) =>
    setForm({ ...form, social_links: form.social_links.filter((_, i) => i !== index) })
  const setFooterLink = (index: number, key: 'label' | 'url', value: string) =>
    setForm({
      ...form,
      footer_links: form.footer_links.map((link, i) => (i === index ? { ...link, [key]: value } : link)),
    })
  const addFooterLink = () => setForm({ ...form, footer_links: [...form.footer_links, { label: '', url: '' }] })
  const removeFooterLink = (index: number) =>
    setForm({ ...form, footer_links: form.footer_links.filter((_, i) => i !== index) })

  const toggleTemplate = (id: string, enabled: boolean) =>
    setForm({
      ...form,
      disabled_templates: enabled
        ? form.disabled_templates.filter((item) => item !== id)
        : [...form.disabled_templates, id],
    })

  const unusedPresets = PRESETS.filter(
    (name) => !form.social_links.some((link) => link.label.toLowerCase() === name.toLowerCase()),
  )

  return (
    <div className="grid grid-cols-1 gap-6 rounded-xl bg-white p-6 shadow xl:grid-cols-2">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          saveMut.mutate(form)
        }}
        className="space-y-5"
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-900">📨 Email Branding</h2>
          <p className="mt-1 text-sm text-gray-500">Header logo and footer contacts used in every email sent to users.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Sender name</label>
          <input
            required
            maxLength={60}
            className={inputClass}
            value={form.sender_name}
            onChange={(e) => setForm({ ...form, sender_name: e.target.value })}
            placeholder="Bibaho"
          />
          <p className="mt-1 text-xs text-gray-500">Shown as the "From" name in inboxes. The sending address and its password are set on the server, not here.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Custom header logo URL (optional)</label>
          <input
            type="url"
            className={inputClass}
            value={form.logo_url}
            onChange={(e) => {
              setLogoBroken(false)
              setForm({ ...form, logo_url: e.target.value })
            }}
            placeholder="https://..."
          />
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-14 min-w-[8rem] items-center justify-center rounded-lg bg-[#0D7377] px-3">
              {!form.logo_url ? (
                <img src={defaultLogo} alt="Default logo" className="h-10 w-auto" />
              ) : logoBroken ? (
                <span className="text-xs text-white/80">Image not found</span>
              ) : (
                <img src={form.logo_url} alt="Logo preview" className="h-10 w-auto" onError={() => setLogoBroken(true)} />
              )}
            </div>
            <p className="text-xs text-gray-500">Leave empty to use the standard বিবাহ logo. A custom logo shows on the teal header, so a white one works best. Use a public https link (e.g. Cloudinary).</p>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Support email (footer)</label>
          <input
            required
            type="email"
            className={inputClass}
            value={form.support_email}
            onChange={(e) => setForm({ ...form, support_email: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Support phone (footer, optional)</label>
          <input
            type="tel"
            maxLength={30}
            className={inputClass}
            value={form.support_phone}
            onChange={(e) => setForm({ ...form, support_phone: e.target.value })}
            placeholder="+880 1793-278360"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Footer social links</label>
            <span className="text-xs text-gray-400">{form.social_links.length}/8</span>
          </div>
          {form.social_links.length === 0 && (
            <p className="mb-2 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500">No social links. The footer shows only the support email.</p>
          )}
          <div className="space-y-2">
            {form.social_links.map((link, index) => (
              <div key={index} className="flex gap-2">
                <input
                  required
                  maxLength={40}
                  className={`${inputClass} max-w-[9rem]`}
                  value={link.label}
                  onChange={(e) => setLink(index, 'label', e.target.value)}
                  placeholder="Name"
                />
                <input
                  required
                  type="url"
                  className={inputClass}
                  value={link.url}
                  onChange={(e) => setLink(index, 'url', e.target.value)}
                  placeholder="https://facebook.com/..."
                />
                <button
                  type="button"
                  onClick={() => removeLink(index)}
                  className="rounded-md p-2 text-red-600 hover:bg-red-50"
                  aria-label={`Remove ${link.label || 'link'}`}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
          {form.social_links.length < 8 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {unusedPresets.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => addLink(name)}
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  + {name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => addLink()}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                <PlusIcon className="h-3.5 w-3.5" /> Custom link
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Emails sent to users</label>
            <span className="text-xs text-gray-400">
              {templates.length - form.disabled_templates.length}/{templates.length} on
            </span>
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-gray-200 p-2">
            {templates.map((item) => {
              const enabled = item.locked || !form.disabled_templates.includes(item.id)
              return (
                <label
                  key={item.id}
                  className={`flex items-start gap-2 rounded px-2 py-1.5 text-sm ${item.locked ? 'text-gray-400' : 'cursor-pointer hover:bg-gray-50'}`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={enabled}
                    disabled={item.locked}
                    onChange={(e) => toggleTemplate(item.id, e.target.checked)}
                  />
                  <span className="min-w-0">
                    <span className="font-medium text-gray-800">{item.code} · {item.name}</span>
                    <span className="block text-xs text-gray-500">
                      {item.trigger}
                      {item.locked && ' — always on (account recovery)'}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
          <p className="mt-1 text-xs text-gray-500">Turned-off emails are skipped. Admin alerts and one-off status emails are always sent.</p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Footer links</label>
            <span className="text-xs text-gray-400">{form.footer_links.length}/8</span>
          </div>
          <p className="mb-2 text-xs text-gray-500">
            Shown above the copyright line, e.g. privacy policy and terms. Use a site path like <code>/privacy-policy</code> or a full https link. An unsubscribe link is always added.
          </p>
          <div className="space-y-2">
            {form.footer_links.map((link, index) => (
              <div key={index} className="flex gap-2">
                <input
                  required
                  maxLength={40}
                  className={`${inputClass} max-w-[11rem]`}
                  value={link.label}
                  onChange={(e) => setFooterLink(index, 'label', e.target.value)}
                  placeholder="Name"
                />
                <input
                  required
                  className={inputClass}
                  value={link.url}
                  onChange={(e) => setFooterLink(index, 'url', e.target.value)}
                  placeholder="/privacy-policy"
                />
                <button
                  type="button"
                  onClick={() => removeFooterLink(index)}
                  className="rounded-md p-2 text-red-600 hover:bg-red-50"
                  aria-label={`Remove ${link.label || 'link'}`}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
          {form.footer_links.length < 8 && (
            <button
              type="button"
              onClick={addFooterLink}
              className="mt-2 inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <PlusIcon className="h-3.5 w-3.5" /> Add link
            </button>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => data && setForm(normalize(data))}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saveMut.isPending}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saveMut.isPending && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
            Save Email Branding
          </button>
        </div>
      </form>

      <div className="flex min-h-[28rem] flex-col">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-gray-700">Live preview</p>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="max-w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
            aria-label="Email template"
          >
            {templates.length === 0 && <option value="">Welcome</option>}
            {templates.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code} · {item.name} — {item.trigger}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2 flex gap-2">
          <input
            type="email"
            className={inputClass}
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="you@example.com"
            aria-label="Send test email to"
          />
          <button
            type="button"
            onClick={() => testMut.mutate()}
            disabled={testMut.isPending || !testTo.trim()}
            className="flex shrink-0 items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {testMut.isPending && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
            Send test
          </button>
        </div>
        {previewSubject && (
          <p className="mb-2 truncate text-xs text-gray-500">
            <span className="font-medium text-gray-700">Subject:</span> {previewSubject} | Bibaho
          </p>
        )}
        {previewError ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800">
            {previewError}
          </div>
        ) : (
          <iframe
            title="Email preview"
            srcDoc={previewHtml}
            sandbox=""
            className="w-full flex-1 rounded-lg border border-gray-200"
          />
        )}
      </div>
    </div>
  )
}

export default EmailBrandingPanel
