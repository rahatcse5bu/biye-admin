import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  PencilSquareIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { BlogInput, BlogPost, BlogStatus, blogService } from '../services/blogService'
import { useConfirm } from '../components/ConfirmDialog'
import RichTextEditor from '../components/RichTextEditor'

const SITE_URL = 'https://www.bibaho.org'

const emptyForm: BlogInput = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image: '',
  author: '',
  seo_title: '',
  seo_description: '',
  tags: '',
  status: 'draft',
}

const toForm = (post: BlogPost): BlogInput => ({
  title: post.title,
  slug: post.slug,
  excerpt: post.excerpt,
  content: post.content,
  cover_image: post.cover_image,
  author: post.author,
  seo_title: post.seo_title || '',
  seo_description: post.seo_description || '',
  tags: (post.tags || []).join(', '),
  status: post.status,
})

const errorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || fallback

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const inputClass =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500'

const Blogs: React.FC = () => {
  const queryClient = useQueryClient()
  const confirm = useConfirm()
  const [editing, setEditing] = useState<BlogPost | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<BlogInput>(emptyForm)
  const [uploading, setUploading] = useState(false)

  const { data: posts = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-blogs'],
    queryFn: blogService.list,
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-blogs'] })

  const saveMutation = useMutation({
    mutationFn: (input: BlogInput) =>
      editing ? blogService.update(editing._id, input) : blogService.create(input),
    onSuccess: (saved) => {
      toast.success(saved.status === 'published' ? 'Post published' : 'Draft saved')
      closeForm()
      refresh()
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to save post')),
  })

  const statusMutation = useMutation({
    mutationFn: (post: BlogPost) =>
      blogService.update(post._id, { status: post.status === 'published' ? 'draft' : 'published' }),
    onSuccess: (saved) => {
      toast.success(saved.status === 'published' ? 'Post published' : 'Post moved to drafts')
      refresh()
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to update status')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => blogService.remove(id),
    onSuccess: () => {
      toast.success('Post deleted')
      refresh()
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to delete post')),
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (post: BlogPost) => {
    setEditing(post)
    setForm(toForm(post))
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
  }

  const setField = <K extends keyof BlogInput>(key: K, value: BlogInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const submitAs = (status: BlogStatus) => (event: React.MouseEvent) => {
    event.preventDefault()
    const formEl = (event.currentTarget as HTMLButtonElement).form
    if (formEl && !formEl.reportValidity()) return
    if (!form.content.trim()) {
      toast.error('Write some content before saving')
      return
    }
    saveMutation.mutate({ ...form, status })
  }

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > 1024 * 1024) {
      toast.error('Cover image must be 1 MB or smaller')
      return
    }
    setUploading(true)
    try {
      setField('cover_image', await blogService.uploadImage(file))
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to upload image'))
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (post: BlogPost) => {
    const ok = await confirm({
      title: `Delete "${post.title}"?`,
      message: 'It will be removed from the website immediately. To hide it, move it to drafts instead.',
      confirmLabel: 'Delete',
    })
    if (ok) deleteMutation.mutate(post._id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blog</h1>
          <p className="mt-1 text-gray-500">
            Published posts appear on the website's blog page (linked in the footer) within about a minute.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          New Post
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-gray-500">
            <ArrowPathIcon className="h-5 w-5 animate-spin" /> Loading posts...
          </div>
        ) : isError ? (
          <div className="p-10 text-center text-red-600">
            Failed to load posts.{' '}
            <button onClick={() => refetch()} className="underline">Retry</button>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No posts yet. Click "New Post" to write the first one.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.map((post) => (
                <tr key={post._id}>
                  <td className="max-w-md px-4 py-3">
                    <div className="font-medium text-gray-900">{post.title}</div>
                    <div className="truncate text-xs text-gray-500">/blog/{post.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => statusMutation.mutate(post)}
                      disabled={statusMutation.isPending}
                      title={post.status === 'published' ? 'Move to drafts' : 'Publish'}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        post.status === 'published'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {post.status === 'published' ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(post.published_at)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(post.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {post.status === 'published' && (
                        <a
                          href={`${SITE_URL}/blog/${encodeURIComponent(post.slug)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
                          aria-label={`View ${post.title} on website`}
                        >
                          <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                        </a>
                      )}
                      <button
                        onClick={() => openEdit(post)}
                        className="rounded-md p-2 text-blue-600 hover:bg-blue-50"
                        aria-label={`Edit ${post.title}`}
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(post)}
                        className="rounded-md p-2 text-red-600 hover:bg-red-50"
                        aria-label={`Delete ${post.title}`}
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
            onSubmit={(event) => event.preventDefault()}
            className="max-h-[92vh] w-full max-w-4xl space-y-4 overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? 'Edit Post' : 'New Post'}
              </h2>
              <button type="button" onClick={closeForm} className="rounded-md p-1 text-gray-500 hover:bg-gray-100" aria-label="Close">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
              <input required className={inputClass} value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="বিয়ের আগে যে ৫টি বিষয় জানা জরুরি" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">URL slug (optional)</label>
                <input className={inputClass} value={form.slug} onChange={(e) => setField('slug', e.target.value)} placeholder="Generated from the title" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Author (optional)</label>
                <input className={inputClass} value={form.author} onChange={(e) => setField('author', e.target.value)} placeholder="বিবাহ টিম" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Short summary (optional)</label>
              <textarea rows={2} maxLength={300} className={inputClass} value={form.excerpt} onChange={(e) => setField('excerpt', e.target.value)} placeholder="Shown on the blog list and in search results" />
            </div>

            <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-800">SEO (optional)</p>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <label className="font-medium text-gray-700">SEO title</label>
                  <span className={form.seo_title.length > 60 ? 'text-amber-600' : 'text-gray-400'}>{form.seo_title.length}/60</span>
                </div>
                <input maxLength={120} className={inputClass} value={form.seo_title} onChange={(e) => setField('seo_title', e.target.value)} placeholder="Uses the title when empty" />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <label className="font-medium text-gray-700">SEO description</label>
                  <span className={form.seo_description.length > 160 ? 'text-amber-600' : 'text-gray-400'}>{form.seo_description.length}/160</span>
                </div>
                <textarea rows={2} maxLength={320} className={inputClass} value={form.seo_description} onChange={(e) => setField('seo_description', e.target.value)} placeholder="Uses the short summary when empty" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Tags</label>
                <input className={inputClass} value={form.tags} onChange={(e) => setField('tags', e.target.value)} placeholder="বিয়ে, পাত্রী, বায়োডাটা" />
                <p className="mt-1 text-xs text-gray-500">Separate with commas. Used as keywords and shown on the post.</p>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Cover image (optional)</label>
              <div className="flex flex-wrap items-center gap-3">
                {form.cover_image ? (
                  <img src={form.cover_image} alt="" className="h-20 w-32 rounded-md object-cover" />
                ) : (
                  <div className="flex h-20 w-32 items-center justify-center rounded-md bg-gray-100 text-gray-400">
                    <PhotoIcon className="h-8 w-8" />
                  </div>
                )}
                <label className="cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  {uploading ? 'Uploading...' : 'Upload image'}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleCoverUpload} />
                </label>
                {form.cover_image && (
                  <button type="button" onClick={() => setField('cover_image', '')} className="text-sm text-red-600 hover:underline">
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Content</label>
              <RichTextEditor
                key={editing?._id || 'new'}
                value={form.content}
                onChange={(html) => setField('content', html)}
                uploadImage={blogService.uploadImage}
                placeholder="Write the post here. Use the toolbar for headings, lists, links and images."
              />
              <p className="mt-1 text-xs text-gray-500">Paste or drag images straight into the text. Each image must be 1 MB or smaller.</p>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button type="button" onClick={closeForm} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="submit"
                onClick={submitAs('draft')}
                disabled={saveMutation.isPending || uploading}
                className="rounded-md border border-blue-600 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 disabled:opacity-50"
              >
                {editing?.status === 'published' ? 'Unpublish & save' : 'Save draft'}
              </button>
              <button
                type="submit"
                onClick={submitAs('published')}
                disabled={saveMutation.isPending || uploading}
                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saveMutation.isPending && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                {editing?.status === 'published' ? 'Update post' : 'Publish'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default Blogs
