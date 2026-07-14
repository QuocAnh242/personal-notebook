'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

interface MinimalEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function MinimalEditor({ content, onChange, placeholder = 'Start writing...' }: MinimalEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable things we don't want to keep it simple
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-neutral dark:prose-invert max-w-none min-h-[320px] resize-none border-0 bg-transparent text-base leading-relaxed text-foreground placeholder:text-muted-foreground/45 shadow-none focus:outline-none focus-visible:ring-0',
      },
    },
  })

  return (
    <div className="minimal-editor-wrapper mt-6 animate-slide-in" style={{ animationDelay: '200ms' }}>
      <EditorContent editor={editor} />
    </div>
  )
}
