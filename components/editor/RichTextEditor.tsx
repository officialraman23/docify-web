"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import { useEffect, useState } from "react";
import { useFormatting } from "@/components/editor/FormattingContext";

type RichTextEditorProps = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

function toolbarButtonClass(isActive: boolean) {
  return [
    "px-3 py-2 rounded-lg transition font-medium border",
    isActive
      ? "bg-blue-500 text-white border-blue-400 shadow-md"
      : "bg-neutral-700 text-white border-neutral-600 hover:bg-neutral-600",
  ].join(" ");
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
}: RichTextEditorProps) {
  const [hasSelection, setHasSelection] = useState(false);
  const { fontFamily, fontSize } = useFormatting();

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
        class: "min-h-[220px] text-white outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      setHasSelection(from !== to);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) return null;

  const applyAction = (action: () => void) => {
    editor.chain().focus();
    action();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => applyAction(() => editor.chain().focus().toggleBold().run())}
          className={toolbarButtonClass(editor.isActive("bold"))}
          title={hasSelection ? "Apply/remove bold on selection" : "Toggle bold for typing"}
        >
          Bold
        </button>

        <button
          type="button"
          onClick={() => applyAction(() => editor.chain().focus().toggleItalic().run())}
          className={toolbarButtonClass(editor.isActive("italic"))}
          title={hasSelection ? "Apply/remove italic on selection" : "Toggle italic for typing"}
        >
          Italic
        </button>

        <button
          type="button"
          onClick={() => applyAction(() => editor.chain().focus().toggleUnderline().run())}
          className={toolbarButtonClass(editor.isActive("underline"))}
          title={hasSelection ? "Apply/remove underline on selection" : "Toggle underline for typing"}
        >
          Underline
        </button>

        <button
          type="button"
          onClick={() => applyAction(() => editor.chain().focus().toggleHighlight().run())}
          className={toolbarButtonClass(editor.isActive("highlight"))}
          title={hasSelection ? "Apply/remove highlight on selection" : "Toggle highlight for typing"}
        >
          Highlight
        </button>

        <button
          type="button"
          onClick={() => applyAction(() => editor.chain().focus().toggleBulletList().run())}
          className={toolbarButtonClass(editor.isActive("bulletList"))}
          title="Toggle bullet list"
        >
          Bullets
        </button>

        <button
          type="button"
          onClick={() => applyAction(() => editor.chain().focus().toggleOrderedList().run())}
          className={toolbarButtonClass(editor.isActive("orderedList"))}
          title="Toggle numbered list"
        >
          Numbered
        </button>

        <button
          type="button"
          onClick={() =>
            applyAction(() => editor.chain().focus().toggleHeading({ level: 1 }).run())
          }
          className={toolbarButtonClass(editor.isActive("heading", { level: 1 }))}
          title="Toggle heading 1"
        >
          H1
        </button>

        <button
          type="button"
          onClick={() =>
            applyAction(() => editor.chain().focus().toggleHeading({ level: 2 }).run())
          }
          className={toolbarButtonClass(editor.isActive("heading", { level: 2 }))}
          title="Toggle heading 2"
        >
          H2
        </button>

        <button
          type="button"
          onClick={() => applyAction(() => editor.chain().focus().setParagraph().run())}
          className={toolbarButtonClass(editor.isActive("paragraph"))}
          title="Set normal paragraph"
        >
          Paragraph
        </button>

        <button
          type="button"
          onClick={() => applyAction(() => editor.chain().focus().setTextAlign("left").run())}
          className={toolbarButtonClass(editor.isActive({ textAlign: "left" }))}
          title="Align left"
        >
          Left
        </button>

        <button
          type="button"
          onClick={() => applyAction(() => editor.chain().focus().setTextAlign("center").run())}
          className={toolbarButtonClass(editor.isActive({ textAlign: "center" }))}
          title="Align center"
        >
          Center
        </button>

        <button
          type="button"
          onClick={() => applyAction(() => editor.chain().focus().setTextAlign("right").run())}
          className={toolbarButtonClass(editor.isActive({ textAlign: "right" }))}
          title="Align right"
        >
          Right
        </button>
      </div>

      <div className="rounded-xl bg-neutral-800 px-4 py-3">
        <style jsx global>{`
          .tiptap {
            min-height: 220px;
            color: white;
            outline: none;
            line-height: 1.8;
            font-size: ${fontSize}px;
            font-family: "${fontFamily}", serif;
          }

          .tiptap p {
            margin: 0.5rem 0;
          }

          .tiptap h1 {
            font-size: ${Math.max(fontSize + 14, 24)}px;
            font-weight: 700;
            line-height: 1.2;
            margin: 1rem 0 0.75rem 0;
          }

          .tiptap h2 {
            font-size: ${Math.max(fontSize + 8, 20)}px;
            font-weight: 700;
            line-height: 1.3;
            margin: 0.9rem 0 0.65rem 0;
          }

          .tiptap ul {
            list-style-type: disc;
            padding-left: 1.5rem;
            margin: 0.75rem 0;
          }

          .tiptap ol {
            list-style-type: decimal;
            padding-left: 1.5rem;
            margin: 0.75rem 0;
          }

          .tiptap li {
            margin: 0.25rem 0;
          }

          .tiptap mark {
            background-color: #fde68a;
            color: black;
            padding: 0.05rem 0.2rem;
            border-radius: 0.2rem;
          }
        `}</style>

        <EditorContent editor={editor} className="tiptap" />
      </div>
    </div>
  );
}