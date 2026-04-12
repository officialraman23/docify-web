import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <div className="w-72 bg-neutral-900 p-5 flex flex-col">
        <div>
          <h1 className="text-xl font-bold mb-6">Docify ✨</h1>

          <div className="space-y-3">
            <Link href="/dashboard/essay" className="block text-gray-300 hover:text-white">
              Essay Builder
            </Link>
            <Link href="/dashboard/outline" className="block text-gray-300 hover:text-white">
              Outline
            </Link>
            <Link href="/dashboard/library" className="block text-gray-300 hover:text-white">
              Library
            </Link>
          </div>
        </div>

        <div className="mt-auto pt-6">
          <button className="text-red-400 text-sm">Log Out</button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">{children}</div>
    </div>
  );
}
