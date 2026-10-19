import React, { useRef, useState } from 'react'
import { EditorContent, useEditor, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extensions'
import { toast } from 'react-toastify'
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  BoldIcon,
  ItalicIcon,
  LinkIcon,
  ListBulletIcon,
  MinusIcon,
  NumberedListIcon,
  PhotoIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from '@heroicons/react/24/outline'

type Props = {
  value: string
  onChange: (html: string) => void
  uploadImage: (file: File) => Promise<string>
  placeholder?: string
}

const MAX_IMAGE_BYTES = 1024 * 1024

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// TODO: posts saved before the rich editor are plain text with "## " headings and "- " bullets.
export const plainTextToHtml = (text: string) => {
  if (!text.trim() || text.trim().startsWith('<')) return text
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
      let html = ''
      let items: string[] = []
      let para: string[] = []
      const flush = () => {
        if (para.length) html += `<p>${para.map(escapeHtml).join('<br>')}</p>`
        if (items.length) html += `<ul>${items.map((item) => `<li><p>${escapeHtml(item)}</p></li>`).join('')}</ul>`
        para = []
        items = []
      }
      lines.forEach((line) => {
        if (line.startsWith('## ')) {
          flush()
          html += `<h2>${escapeHtml(line.slice(3))}</h2>`
        } else if (/^[-*]\s+/.test(line)) {
          if (para.length) flush()
          items.push(line.replace(/^[-*]\s+/, ''))
        } else {
          if (items.length) flush()
          para.push(line)
        }
      })
      flush()
      return html
    })
    .join('')
}

const ToolbarButton: React.FC<{
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}> = ({ label, active, disabled, onClick, children }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    aria-pressed={active}
    disabled={disabled}
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
    className={`flex h-8 min-w-8 items-center justify-center rounded px-1.5 text-sm font-semibold transition-colors disabled:opacity-40 ${
      active ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
    }`}
  >
    {children}
  </button>
)

const Divider = () => <span className="mx-1 h-6 w-px bg-gray-200" aria-hidden="true" />

const RichTextEditor: React.FC<Props> = ({ value, onChange, uploadImage, placeholder }) => {
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [linkUrl, setLinkUrl] = useState<string | null>(null)
  const editorRef = useRef<Editor | null>(null)

  const insertImages = async (files: File[]) => {
    const editor = editorRef.current
    const images = files.filter((file) => file.type.startsWith('image/'))
    if (!editor || !images.length) return
    if (images.some((file) => file.size > MAX_IMAGE_BYTES)) {
      toast.error('Each image must be 1 MB or smaller')
      return
    }
    setUploading(true)
    try {
      for (const file of images) {
        const src = await uploadImage(file)
        editor.chain().focus().setImage({ src, alt: '' }).run()
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        code: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
      Image,
      Placeholder.configure({ placeholder: placeholder || 'Start writing…' }),
    ],
    content: plainTextToHtml(value),
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: { class: 'blog-editor-content' },
      // TODO: pasted or dropped image files are uploaded instead of being embedded as base64.
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files || [])
        if (!files.some((file) => file.type.startsWith('image/'))) return false
        void insertImages(files)
        return true
      },
      handleDrop: (_view, event) => {
        const files = Array.from((event as DragEvent).dataTransfer?.files || [])
        if (!files.some((file) => file.type.startsWith('image/'))) return false
        event.preventDefault()
        void insertImages(files)
        return true
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.isEmpty ? '' : current.getHTML()),
  })
  editorRef.current = editor

  if (!editor) return null

  const openLink = () => setLinkUrl(editor.getAttributes('link').href || 'https://')

  const applyLink = (event: React.SyntheticEvent) => {
    event.preventDefault()
    const href = (linkUrl || '').trim()
    const chain = editor.chain().focus().extendMarkRange('link')
    if (!href || href === 'https://') chain.unsetLink().run()
    else chain.setLink({ href }).run()
    setLinkUrl(null)
  }

  return (
    <div className="overflow-hidden rounded-md border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 p-1">
        <ToolbarButton label="Paragraph" active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()}>
          P
        </ToolbarButton>
        <ToolbarButton label="Heading" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </ToolbarButton>
        <ToolbarButton label="Subheading" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </ToolbarButton>
        <Divider />
        <ToolbarButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <BoldIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <ItalicIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <StrikethroughIcon className="h-4 w-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton label="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <ListBulletIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <NumberedListIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <span className="text-lg leading-none">”</span>
        </ToolbarButton>
        <ToolbarButton label="Divider line" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <MinusIcon className="h-4 w-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton label="Link" active={editor.isActive('link')} onClick={openLink}>
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label={uploading ? 'Uploading image…' : 'Insert image'} disabled={uploading} onClick={() => fileInput.current?.click()}>
          <PhotoIcon className={`h-4 w-4 ${uploading ? 'animate-pulse' : ''}`} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
          <ArrowUturnLeftIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
          <ArrowUturnRightIcon className="h-4 w-4" />
        </ToolbarButton>
        {uploading && <span className="ml-2 text-xs text-gray-500">Uploading image…</span>}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            const files = Array.from(event.target.files || [])
            event.target.value = ''
            void insertImages(files)
          }}
        />
      </div>

      {linkUrl !== null && (
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-2 py-2">
          <input
            autoFocus
            type="url"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') applyLink(event)
              if (event.key === 'Escape') setLinkUrl(null)
            }}
            placeholder="https://example.com"
            className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <button type="button" onClick={applyLink} className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">
            Apply
          </button>
          {editor.isActive('link') && (
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().extendMarkRange('link').unsetLink().run()
                setLinkUrl(null)
              }}
              className="rounded px-3 py-1 text-sm text-red-600 hover:bg-red-50"
            >
              Remove link
            </button>
          )}
          <button type="button" onClick={() => setLinkUrl(null)} className="rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
        </div>
      )}

      <EditorContent editor={editor} className="max-h-[55vh] min-h-[320px] overflow-y-auto bg-white" />
    </div>
  )
}

export default RichTextEditor
