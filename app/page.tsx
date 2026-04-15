"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, appleProvider, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function Home() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleAuthSuccess = async (user: any) => {
  try {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || "",
        credits: 10,
        createdAt: new Date().toISOString(),
      });
    } else {
      const existingData = snap.data();

      if (
        existingData.credits === undefined ||
        existingData.credits === null
      ) {
        await setDoc(
          userRef,
          {
            credits: 10,
          },
          { merge: true }
        );
      }
    }

    localStorage.setItem("docify_uid", user.uid);
    router.push("/dashboard/essay");
  } catch (err) {
    console.error("User setup failed:", err);
  }
};

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      await handleAuthSuccess(result.user);
    } catch (err) {
      console.error("Google login failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, appleProvider);
      await handleAuthSuccess(result.user);
    } catch (err) {
      console.error("Apple login failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-neutral-900 p-8 rounded-3xl space-y-6 border border-neutral-800">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Docify ✨</h1>
          <p className="text-gray-400 text-sm">
            AI-powered writing assistant
          </p>
        </div>

        {/* Toggle */}
        <div className="flex bg-neutral-800 rounded-xl p-1">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2 rounded-lg ${
              mode === "login" ? "bg-white text-black" : "text-gray-400"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 rounded-lg ${
              mode === "signup" ? "bg-white text-black" : "text-gray-400"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 bg-neutral-800 rounded-xl outline-none"
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 bg-neutral-800 rounded-xl outline-none"
        />

        {/* Main button (we’ll wire later) */}
        <button className="w-full bg-blue-500 py-3 rounded-xl font-semibold opacity-50">
          {mode === "login" ? "Login (Coming Soon)" : "Create Account (Coming Soon)"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 text-gray-500 text-sm">
          <div className="flex-1 h-px bg-neutral-700" />
          OR
          <div className="flex-1 h-px bg-neutral-700" />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white text-black py-3 rounded-xl font-medium disabled:opacity-50"
        >
          {loading ? "Loading..." : "Continue with Google"}
        </button>

        {/* Apple */}
        <button
          onClick={handleAppleLogin}
          disabled={loading}
          className="w-full bg-black border border-white py-3 rounded-xl font-medium disabled:opacity-50"
        >
          {loading ? "Loading..." : "Continue with Apple"}
        </button>

        <p className="text-center text-sm text-gray-400">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <span
            onClick={() =>
              setMode(mode === "login" ? "signup" : "login")
            }
            className="text-blue-400 cursor-pointer"
          >
            {mode === "login" ? "Create account" : "Login"}
          </span>
        </p>
      </div>
    </main>
  );
}