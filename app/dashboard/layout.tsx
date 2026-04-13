"use client";

import Link from "next/link";
import {
  FormattingProvider,
  useFormatting,
} from "@/components/editor/FormattingContext";

function Sidebar() {
  const { font, setFont, fontSize, increaseFont, decreaseFont } =
    useFormatting();

  return (
    <aside className="w-72 h-screen sticky top-0 bg-neutral-900 p-5 border-r border-neutral-800">
      <h1 className="text-xl font-bold mb-6">Docify ✨</h1>

      <div className="space-y-3">
        <Link href="/dashboard/essay" className="block">
          Essay Builder
        </Link>
        <Link href="/dashboard/outline" className="block">
          Outline
        </Link>
        <Link href="/dashboard/library" className="block">
          Library
        </Link>
      </div>

      <div className="mt-10 space-y-4">
        <div className="bg-neutral-800 p-3 rounded-xl">
          <p className="text-sm mb-2">Font</p>
          <select
            value={font}
            onChange={(e) => setFont(e.target.value as any)}
            className="w-full bg-neutral-700 p-2 rounded"
          >
            <option value="serif">Times New Roman</option>
            <option value="sans">Arial / Calibri</option>
            <option value="mono">Monospace</option>
          </select>
        </div>

        <div className="bg-neutral-800 p-3 rounded-xl">
          <p className="text-sm mb-2">Font Size</p>
          <div className="flex items-center gap-3">
            <button onClick={decreaseFont} className="bg-neutral-700 px-3 py-2 rounded">
              -
            </button>
            <span>{fontSize}</span>
            <button onClick={increaseFont} className="bg-neutral-700 px-3 py-2 rounded">
              +
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <button className="text-red-400 text-sm">Log Out</button>
      </div>
    </aside>
  );
}

export default function Layout({ children }: any) {
  return (
    <FormattingProvider>
      <div className="flex bg-black text-white min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </FormattingProvider>
  );
}