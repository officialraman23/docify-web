import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <h1 className="text-5xl font-bold mb-4">
        Docify ✨
      </h1>

      <p className="text-lg text-gray-400 mb-8 text-center max-w-xl">
        AI-powered document & essay builder for students. Write faster, smarter, and better.
      </p>

      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="bg-white text-black px-6 py-3 rounded-xl font-semibold"
        >
          Get Started
        </Link>

        <button className="border border-gray-600 px-6 py-3 rounded-xl">
          Learn More
        </button>
      </div>
    </main>
  );
}