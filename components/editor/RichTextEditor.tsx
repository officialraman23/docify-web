"use client";

import { useEffect, useRef } from "react";
import { useFormatting } from "@/components/editor/FormattingContext";

type RichTextEditorProps = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

function getFontFamily(font: string) {
  if (font === "serif") return '"Times New Roman", Times, serif';
  if (font === "sans") return "Arial, Helvetica, sans-serif";
  if (font === "mono") return "Menlo, Monaco, monospace";
  return '"Times New Roman", Times, serif';
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const { font, fontSize } = useFormatting();

  useEffect(() => {
    if (!editorRef.current) return;

    if (editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content || "";
    }
  }, [content]);

  const runCommand = (command: string, value?: string) => {
    editorRef.current?.focus();

    if (command === "insertUnorderedList") {
      document.execCommand("insertUnorderedList", false);

      setTimeout(() => {
        const lists = editorRef.current?.querySelectorAll("ul");
        lists?.forEach((ul) => {
          (ul as HTMLElement).style.listStyleType = "disc";
          (ul as HTMLElement).style.paddingLeft = "20px";
        });
      }, 0);
    } else {
      document.execCommand(command, false, value);
    }

    onChange(editorRef.current?.innerHTML || "");
  };

  const handleInput = () => {
    onChange(editorRef.current?.innerHTML || "");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => runCommand("bold")}
          className="bg-neutral-700 px-3 py-2 rounded-lg"
        >
          Bold
        </button>

        <button
          type="button"
          onClick={() => runCommand("italic")}
          className="bg-neutral-700 px-3 py-2 rounded-lg"
        >
          Italic
        </button>

        <button
          type="button"
          onClick={() => runCommand("underline")}
          className="bg-neutral-700 px-3 py-2 rounded-lg"
        >
          Underline
        </button>

        <button
          type="button"
          onClick={() => runCommand("insertUnorderedList")}
          className="bg-neutral-700 px-3 py-2 rounded-lg"
        >
          Bullets
        </button>

        <button
          type="button"
          onClick={() => runCommand("insertOrderedList")}
          className="bg-neutral-700 px-3 py-2 rounded-lg"
        >
          Numbered
        </button>

        <button
          type="button"
          onClick={() => runCommand("justifyLeft")}
          className="bg-neutral-700 px-3 py-2 rounded-lg"
        >
          Left
        </button>

        <button
          type="button"
          onClick={() => runCommand("justifyCenter")}
          className="bg-neutral-700 px-3 py-2 rounded-lg"
        >
          Center
        </button>

        <button
          type="button"
          onClick={() => runCommand("justifyRight")}
          className="bg-neutral-700 px-3 py-2 rounded-lg"
        >
          Right
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="w-full min-h-[240px] rounded-2xl bg-neutral-800 text-white px-4 py-4 outline-none overflow-auto"
        style={{
          fontFamily: getFontFamily(font),
          fontSize: `${fontSize}px`,
          lineHeight: 1.9,
        }}
      />

      <style jsx>{`
        div[contenteditable="true"]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
        }

        div[contenteditable="true"] ul {
          list-style-type: disc;
          padding-left: 20px;
          margin: 10px 0;
        }

        div[contenteditable="true"] ol {
          list-style-type: decimal;
          padding-left: 20px;
          margin: 10px 0;
        }

        div[contenteditable="true"] li {
          margin: 4px 0;
        }
      `}</style>
    </div>
  );
}