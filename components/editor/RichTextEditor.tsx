"use client";

import { useEffect, useId, useRef } from "react";
import { useFormatting } from "@/components/editor/FormattingContext";

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
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<any>(null);
  const lastHtmlRef = useRef(content);
  const toolbarId = useId().replace(/:/g, "");
  const { fontFamily, fontSize } = useFormatting();

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!editorRef.current || quillRef.current) return;

      const QuillModule = await import("quill");
      const Quill = QuillModule.default;

      const Font = Quill.import("formats/font");
      Font.whitelist = ["serif", "sans", "monospace"];
      Quill.register(Font, true);

      const Size = Quill.import("attributors/style/size");
      Size.whitelist = [
        "12px",
        "14px",
        "16px",
        "18px",
        "20px",
        "24px",
        "28px",
        "32px",
      ];
      Quill.register(Size, true);

      const quill = new Quill(editorRef.current, {
        theme: "snow",
        placeholder,
        modules: {
          toolbar: `#${toolbarId}`,
        },
        formats: [
          "font",
          "size",
          "bold",
          "italic",
          "underline",
          "header",
          "list",
          "bullet",
          "align",
          "image",
        ],
      });

      quill.root.innerHTML = content || "";

      quill.on("text-change", () => {
        const html = quill.root.innerHTML;
        lastHtmlRef.current = html;
        onChange(html);
      });

      if (!mounted) return;
      quillRef.current = quill;

      // apply initial font + size to all content
      const length = quill.getLength();
      quill.formatText(0, length, "font", fontFamily);
      quill.formatText(0, length, "size", `${fontSize}px`);
    }

    init();

    return () => {
      mounted = false;
    };
  }, [content, onChange, placeholder, toolbarId]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    const currentHtml = quill.root.innerHTML;
    if (content !== currentHtml && content !== lastHtmlRef.current) {
      quill.root.innerHTML = content || "";
      lastHtmlRef.current = content;
    }
  }, [content]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    const length = quill.getLength();
    quill.formatText(0, length, "font", fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    const length = quill.getLength();
    quill.formatText(0, length, "size", `${fontSize}px`);
  }, [fontSize]);

  return (
    <div className="space-y-3">
      <div
        id={toolbarId}
        className="flex flex-wrap gap-2 rounded-xl bg-neutral-900 p-3 border border-neutral-800"
      >
        <select className="ql-font bg-neutral-700 text-white rounded px-2 py-2">
          <option value="serif">Serif</option>
          <option value="sans">Sans</option>
          <option value="monospace">Monospace</option>
        </select>

        <select className="ql-size bg-neutral-700 text-white rounded px-2 py-2">
          <option value="12px">12</option>
          <option value="14px">14</option>
          <option value="16px">16</option>
          <option value="18px">18</option>
          <option value="20px">20</option>
          <option value="24px">24</option>
          <option value="28px">28</option>
          <option value="32px">32</option>
        </select>

        <button className="ql-bold" />
        <button className="ql-italic" />
        <button className="ql-underline" />
        <button className="ql-list" value="ordered" />
        <button className="ql-list" value="bullet" />
        <button className="ql-header" value="1" />
        <button className="ql-header" value="2" />
        <button className="ql-align" value="" />
        <button className="ql-align" value="center" />
        <button className="ql-align" value="right" />
        <button className="ql-clean" />
      </div>

      <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-white">
        <style jsx global>{`
          .ql-toolbar.ql-snow {
            border: 0 !important;
            background: #f8fafc !important;
            border-bottom: 1px solid #e5e7eb !important;
          }

          .ql-container.ql-snow {
            border: 0 !important;
          }

          .ql-editor {
            min-height: 240px;
            color: #111827;
            line-height: 1.9;
            background: white;
          }

          .ql-editor.ql-blank::before {
            color: #9ca3af !important;
            font-style: normal !important;
          }

          .ql-font-serif {
            font-family: Georgia, "Times New Roman", serif;
          }

          .ql-font-sans {
            font-family: Arial, Helvetica, sans-serif;
          }

          .ql-font-monospace {
            font-family: Menlo, Monaco, monospace;
          }
        `}</style>

        <div ref={editorRef} />
      </div>
    </div>
  );
}