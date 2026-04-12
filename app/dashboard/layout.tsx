export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-black text-white">

      {/* Sidebar */}
      <div className="w-72 bg-neutral-900 p-5 flex flex-col justify-between">
        
        <div>
          <h1 className="text-xl font-bold mb-6">Docify ✨</h1>

          {/* Navigation */}
          <div className="space-y-3">
            <a href="/dashboard/essay" className="block text-gray-300 hover:text-white">
              Essay Builder
            </a>
            <a href="/dashboard/outline" className="block text-gray-300 hover:text-white">
              Outline
            </a>
            <a href="/dashboard/library" className="block text-gray-300 hover:text-white">
              Library
            </a>
          </div>

          {/* Styles */}
          <div className="mt-8">
            <p className="text-sm text-gray-400 mb-2">Styles</p>
            <div className="flex gap-2">
              <button className="bg-blue-500 px-3 py-1 rounded">APA</button>
              <button className="bg-gray-700 px-3 py-1 rounded">MLA</button>
            </div>
          </div>

          {/* Formatting */}
          <div className="mt-8">
            <p className="text-sm text-gray-400 mb-2">Formatting</p>
            <div className="flex items-center gap-2">
              <span>Font: 12</span>
              <button className="px-2 bg-gray-700 rounded">-</button>
              <button className="px-2 bg-gray-700 rounded">+</button>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div>
          <div className="bg-neutral-800 p-3 rounded-lg mb-3">
            <p className="text-sm">Credits</p>
            <p className="text-xl font-bold">10</p>
            <button className="bg-blue-500 w-full mt-2 py-1 rounded">
              Buy Credits
            </button>
          </div>

          <button className="text-red-400 text-sm">Log Out</button>
        </div>

      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {children}
      </div>

    </div>
  )
}
