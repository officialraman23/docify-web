"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, onAuthStateChanged, User } from "firebase/auth";

import {
  FormattingProvider,
  useFormatting,
} from "@/components/editor/FormattingContext";
import { auth } from "@/lib/firebase";

function Sidebar() {
  const { font, setFont, fontSize, increaseFont, decreaseFont } =
    useFormatting();

  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut(auth);
      localStorage.removeItem("docify_uid");
      router.replace("/");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const linkClass = (href: string) =>
    `block rounded-xl px-3 py-2 transition ${
      pathname === href
        ? "bg-white text-black font-semibold"
        : "text-gray-300 hover:bg-neutral-800 hover:text-white"
    }`;

  return (
    <aside className="w-72 h-screen sticky top-0 shrink-0 bg-neutral-900 p-5 border-r border-neutral-800 overflow-y-auto">
      <h1 className="text-xl font-bold mb-6">Docify ✨</h1>

      <div className="space-y-2">
        <Link href="/dashboard/essay" className={linkClass("/dashboard/essay")}>
          Essay Builder
        </Link>
        <Link
          href="/dashboard/outline"
          className={linkClass("/dashboard/outline")}
        >
          Outline
        </Link>
        <Link
          href="/dashboard/library"
          className={linkClass("/dashboard/library")}
        >
          Library
        </Link>
      </div>

      <div className="mt-10 space-y-4">
        <div className="bg-neutral-800 p-3 rounded-xl">
          <p className="text-sm mb-2">Font</p>
          <select
            value={font}
            onChange={(e) =>
              setFont(e.target.value as "serif" | "sans" | "mono")
            }
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
            <button
              onClick={decreaseFont}
              className="bg-neutral-700 px-3 py-2 rounded"
            >
              -
            </button>
            <span>{fontSize}</span>
            <button
              onClick={increaseFont}
              className="bg-neutral-700 px-3 py-2 rounded"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="text-red-400 text-sm disabled:opacity-50"
        >
          {isLoggingOut ? "Logging out..." : "Log Out"}
        </button>
      </div>
    </aside>
  );
}

function ProtectedDashboard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecked(true);

      if (user) {
        localStorage.setItem("docify_uid", user.uid);
      } else {
        localStorage.removeItem("docify_uid");
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    if (!currentUser) {
      router.replace("/");
    }
  }, [authChecked, currentUser, router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Checking login...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="flex bg-black text-white min-h-screen">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto p-6">{children}</main>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <FormattingProvider>
      <ProtectedDashboard>{children}</ProtectedDashboard>
    </FormattingProvider>
  );
}