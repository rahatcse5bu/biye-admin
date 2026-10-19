import api from './api'

export type BlogStatus = 'draft' | 'published'

export interface BlogPost {
  _id: string
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image: string
  author: string
  status: BlogStatus
  published_at: string | null
  createdAt: string
  updatedAt: string
}

export type BlogInput = Pick<BlogPost, 'title' | 'slug' | 'excerpt' | 'content' | 'cover_image' | 'author' | 'status'>

export const blogService = {
  list: async (): Promise<BlogPost[]> => {
    const res = await api.get('/api/v1/blogs/admin')
    return res.data.data || []
  },

  create: async (data: BlogInput) => {
    const res = await api.post('/api/v1/blogs', data)
    return res.data.data as BlogPost
  },

  update: async (id: string, data: Partial<BlogInput>) => {
    const res = await api.patch(`/api/v1/blogs/${id}`, data)
    return res.data.data as BlogPost
  },

  remove: async (id: string) => {
    await api.delete(`/api/v1/blogs/${id}`)
  },

  uploadImage: async (file: File) => {
    const body = new FormData()
    body.append('images', file)
    const res = await api.post('/api/v1/uploads/images', body, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
    return res.data.data.urls[0] as string
  },
}
