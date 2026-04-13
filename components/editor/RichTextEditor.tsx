"use client";

import { useEffect, useId, useRef } from "react";
import { useFormatting } from "@/components/editor/FormattingContext";

type RichTextEditorProps = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

declare global {
  interface Window {
    Quill: any;
  }
}

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
      Font.whitelist = [
        "serif",
        "sans",
        "mono",
        "inter",
        "lora",
        "merriweather",
        "source-serif",
        "plex-sans",
        "plex-serif",
      ];
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
      });

      quill.root.innerHTML = content || "";

      quill.on("text-change", () => {
        const html = quill.root.innerHTML;
        lastHtmlRef.current = html;
        onChange(html);
      });

      if (!mounted) return;
      quillRef.current = quill;

      // default formatting on first load
      quill.format("font", mapFontToQuill(fontFamily));
      quill.format("size", `${fontSize}px`);
    }

    init();

    return () => {
      mounted = false;
    };
  }, [content, onChange, placeholder, toolbarId, fontFamily, fontSize]);

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

    quill.format("font", mapFontToQuill(fontFamily));
  }, [fontFamily]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    quill.format("size", `${fontSize}px`);
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
          <option value="mono">Mono</option>
          <option value="inter">Inter</option>
          <option value="lora">Lora</option>
          <option value="merriweather">Merriweather</option>
          <option value="source-serif">Source Serif</option>
          <option value="plex-sans">IBM Plex Sans</option>
          <option value="plex-serif">IBM Plex Serif</option>
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

      <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-800">
        <style jsx global>{`
          .ql-toolbar.ql-snow {
            border: 0 !important;
            background: transparent !important;
          }

          .ql-container.ql-snow {
            border: 0 !important;
            font-size: ${fontSize}px;
          }

          .ql-editor {
            min-height: 220px;
            color: white;
            line-height: 1.9;
          }

          .ql-editor.ql-blank::before {
            color: #9ca3af !important;
            font-style: normal !important;
          }

          .ql-snow .ql-stroke {
            stroke: white !important;
          }

          .ql-snow .ql-fill {
            fill: white !important;
          }

          .ql-snow .ql-picker {
            color: white !important;
          }

          .ql-font-serif {
            font-family: Georgia, "Times New Roman", serif;
          }

          .ql-font-sans {
            font-family: Arial, Helvetica, sans-serif;
          }

          .ql-font-mono {
            font-family: Menlo, Monaco, monospace;
          }

          .ql-font-inter {
            font-family: Inter, Arial, sans-serif;
          }

          .ql-font-lora {
            font-family: Lora, Georgia, serif;
          }

          .ql-font-merriweather {
            font-family: Merriweather, Georgia, serif;
          }

          .ql-font-source-serif {
            font-family: "Source Serif 4", Georgia, serif;
          }

          .ql-font-plex-sans {
            font-family: "IBM Plex Sans", Arial, sans-serif;
          }

          .ql-font-plex-serif {
            font-family: "IBM Plex Serif", Georgia, serif;
          }
        `}</style>

        <div ref={editorRef} />
      </div>
    </div>
  );
}

function mapFontToQuill(fontFamily: string) {
  switch (fontFamily) {
    case "Inter":
      return "inter";
    case "Lora":
      return "lora";
    case "Merriweather":
      return "merriweather";
    case "Source Serif 4":
      return "source-serif";
    case "IBM Plex Sans":
      return "plex-sans";
    case "IBM Plex Serif":
      return "plex-serif";
    default:
      return "source-serif";
  }
}