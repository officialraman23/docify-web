"use client";

import { useState } from "react";
import { OAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db, googleProvider } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export default function Home() {
  const [loadingProvider, setLoadingProvider] = useState<"google" | "apple" | null>(null);

  const ensureUserDocument = async (user: {
    uid: string;
    displayName: string | null;
    email: string | null;
    providerId?: string;
  }) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(
        userRef,
        {
          displayName: user.displayName || "User",
          email: user.email || "",
          provider: user.providerId || "unknown",
          freeCredits: 10,
          paidCredits: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      return;
    }

    await setDoc(
      userRef,
      {
        displayName: user.displayName || userSnap.data().displayName || "User",
        email: user.email || userSnap.data().email || "",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const handleGoogleLogin = async () => {
    try {
      setLoadingProvider("google");

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      localStorage.setItem("docify_uid", user.uid);

      await ensureUserDocument({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        providerId: "google",
      });

      window.location.href = "/dashboard/essay";
    } catch (error: any) {
      console.error("Google login failed:", error);
      alert(error.message || "Google login failed");
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setLoadingProvider("apple");

      const provider = new OAuthProvider("apple.com");
      provider.addScope("email");
      provider.addScope("name");

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      localStorage.setItem("docify_uid", user.uid);

      await ensureUserDocument({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        providerId: "apple",
      });

      window.location.href = "/dashboard/essay";
    } catch (error: any) {
      console.error("Apple login failed:", error);

      if (error.code === "auth/popup-closed-by-user") return;

      alert(error.message || "Apple login failed");
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="mx-auto grid min-h-[88vh] max-w-6xl items-center gap-10 lg:grid-cols-2">
        <section className="space-y-8">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
            Trusted by 20,000+ students worldwide
          </div>

          <div className="space-y-5">
            <h1 className="text-5xl font-bold leading-tight md:text-6xl">
              Write smarter.
              <br />
              Finish faster.
              <br />
              <span className="text-blue-400">Submit with confidence.</span>
            </h1>

            <p className="max-w-xl text-lg leading-8 text-gray-400">
              Docify helps students build essays, outlines, citations, and polished academic work in one focused workspace.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
              <p className="text-3xl font-bold">20k+</p>
              <p className="mt-2 text-sm text-gray-400">Students reached</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
              <p className="text-3xl font-bold">4.9/5</p>
              <p className="mt-2 text-sm text-gray-400">User satisfaction</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
              <p className="text-3xl font-bold">24/7</p>
              <p className="mt-2 text-sm text-gray-400">Writing support</p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-400">
            <div>✓ Essay builder with live formatting</div>
            <div>✓ Outline generator and citation helper</div>
            <div>✓ Export to PDF and DOCX</div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md rounded-[32px] border border-white/10 bg-neutral-950 p-8 shadow-2xl shadow-blue-500/10">
          <div className="mb-8 text-center">
            <h2 className="text-5xl font-bold">Docify ✨</h2>
            <p className="mt-3 text-base text-gray-400">
              Join students writing better papers in less time.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loadingProvider !== null}
              className="flex w-full items-center justify-center rounded-2xl bg-white px-5 py-4 text-lg font-semibold text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingProvider === "google" ? "Connecting Google..." : "Continue with Google"}
            </button>

            <button
              onClick={handleAppleLogin}
              disabled={loadingProvider !== null}
              className="flex w-full items-center justify-center rounded-2xl border border-white/20 bg-black px-5 py-4 text-lg font-semibold text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingProvider === "apple" ? "Connecting Apple..." : "Continue with Apple"}
            </button>
          </div>

          <div className="my-8 h-px w-full bg-white/10" />

          <div className="space-y-4 rounded-2xl bg-white/[0.03] p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
              Why students choose Docify
            </p>

            <div className="space-y-3 text-sm text-gray-300">
              <p>• Build full essays and outlines in one place</p>
              <p>• Improve clarity, grammar, and academic tone instantly</p>
              <p>• Save hours on formatting and citation work</p>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            By continuing, you agree to use Docify for your own academic workflow.
          </p>
        </section>
      </div>
    </main>
  );
}
