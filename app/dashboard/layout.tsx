"use client";

import Link from "next/link";
import {
  FormattingProvider,
  useFormatting,
} from "@/components/editor/FormattingContext";
import {
  editorFontNames,
  type EditorFontName,
} from "@/lib/editorFonts";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const {
    fontFamily,
    setFontFamily,
    fontSize,
    increaseFontSize,
    decreaseFontSize,
  } = useFormatting();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex">
        <aside className="w-72 h-screen sticky top-0 bg-neutral-900 p-5 border-r border-neutral-800 overflow-y-auto">
          <div>
            <h1 className="text-xl font-bold mb-6">Docify ✨</h1>

            <div className="space-y-3">
              <Link
                href="/dashboard/essay"
                className="block text-gray-300 hover:text-white"
              >
                Essay Builder
              </Link>
              <Link
                href="/dashboard/outline"
                className="block text-gray-300 hover:text-white"
              >
                Outline
              </Link>
              <Link
                href="/dashboard/library"
                className="block text-gray-300 hover:text-white"
              >
                Library
              </Link>
            </div>

            <div className="mt-10">
              <h2 className="text-sm uppercase tracking-wide text-gray-400 mb-3">
                Formatting
              </h2>

              <div className="space-y-4">
                <div className="bg-neutral-800 rounded-xl p-3">
                  <p className="text-sm text-gray-400 mb-2">Font Family</p>
                  <select
                    value={fontFamily}
                    onChange={(e) =>
                      setFontFamily(e.target.value as EditorFontName)
                    }
                    className="w-full bg-neutral-700 rounded-lg px-3 py-2 outline-none"
                  >
                    {editorFontNames.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-neutral-800 rounded-xl p-3">
                  <p className="text-sm text-gray-400 mb-2">Font Size</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={decreaseFontSize}
                      className="bg-neutral-700 px-3 py-2 rounded-lg"
                    >
                      -
                    </button>
                    <div className="min-w-[48px] text-center font-medium">
                      {fontSize}
                    </div>
                    <button
                      onClick={increaseFontSize}
                      className="bg-neutral-700 px-3 py-2 rounded-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <button className="text-red-400 text-sm">Log Out</button>
          </div>
        </aside>

        <main className="flex-1 p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FormattingProvider>
      <DashboardShell>{children}</DashboardShell>
    </FormattingProvider>
  );
}