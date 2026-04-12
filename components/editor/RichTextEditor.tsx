"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import { useEffect } from "react";

type RichTextEditorProps = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: true,
        orderedList: true,
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Highlight,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[220px] rounded-xl bg-neutral-800 px-4 py-3 outline-none text-white prose prose-invert max-w-none focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="bg-neutral-700 px-3 py-2 rounded-lg"
        >
          Bold
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="bg-neutral-700 px-3 py-2 rounded-lg"
        >
          Italic
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className="bg-neutral-700 px-3 py-2 rounded-lg"
        >
          Underline
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className="bg-neutral-700 px-3 py-2 rounded-lg"
        >
          Highlight
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="bg-neutral-700 px-3 py-2 rounded-lg"
        >
          Bullets
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="bg-neutral-700 px-3 py-2 rounded-lg"
        >
          Numbered
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className="bg-neutral-700 px-3 py-2 rounded-lg"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className="bg-neutral-700 px-3 py-2 rounded-lg"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().setParagraph().run()}
          className="bg-neutral-700 px-3 py-2 rounded-lg"
        >
          Paragraph
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className="bg-neutral-700 px-3 py-2 rounded-lg"
        >
          Left
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className="bg-neutral-700 px-3 py-2 rounded-lg"
        >
          Center
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className="bg-neutral-700 px-3 py-2 rounded-lg"
        >
          Right
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}