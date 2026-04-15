"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import DocumentPreview from "@/components/editor/DocumentPreview";
import RichTextEditor from "@/components/editor/RichTextEditor";
import {
  FormattingProvider,
  useFormatting,
} from "@/components/editor/FormattingContext";
import { exportTextToPdf, exportTextToDocx } from "@/lib/exportUtils";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";

type BodyParagraph = {
  id: string;
  text: string;
};

type CreditPack = {
  id: string;
  name: string;
  credits: number;
  price: number;
  isActive: boolean;
  stripePriceId?: string;
};

type AiMode = "check" | "improve" | "shorten" | "expand" | "academic";

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function EssayPageContent() {
  const { font, fontSize } = useFormatting();
  const searchParams = useSearchParams();
  const pageRootRef = useRef<HTMLDivElement | null>(null);

  const [name, setName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [teacher, setTeacher] = useState("");
  const [course, setCourse] = useState("");
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");

  const [introduction, setIntroduction] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [references, setReferences] = useState("");

  const [selectedStyle, setSelectedStyle] = useState<"APA" | "MLA">("APA");
  const [credits, setCredits] = useState(0);
  const [selectedTextPreview, setSelectedTextPreview] = useState("");
  const [aiResult, setAiResult] = useState("AI output will appear here.");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [bodyParagraphs, setBodyParagraphs] = useState<BodyParagraph[]>([
    { id: crypto.randomUUID(), text: "" },
  ]);

  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([]);
  const [showBuyCredits, setShowBuyCredits] = useState(false);

  const getCurrentUid = () => {
    if (typeof window === "undefined") return null;

    const authUid = auth.currentUser?.uid;
    if (authUid) return authUid;

    return localStorage.getItem("docify_uid");
  };

  const getAiLoadingText = (mode: AiMode) => {
    switch (mode) {
      case "check":
        return "Checking...";
      case "improve":
        return "Improving...";
      case "shorten":
        return "Shortening...";
      case "expand":
        return "Expanding...";
      case "academic":
        return "Rewriting academically...";
      default:
        return "Processing...";
    }
  };

  const getAiCost = (mode: AiMode) => {
    switch (mode) {
      case "improve":
        return 2;
      case "check":
      case "shorten":
      case "expand":
      case "academic":
      default:
        return 1;
    }
  };

  const loadUserCredits = async () => {
    try {
      const uid = getCurrentUid();

      if (!uid) {
        setCredits(0);
        return;
      }

      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        const totalCredits = Number(data.credits ?? 0);

        setCredits(
          totalCredits ||
            Number(data.freeCredits ?? 0) + Number(data.paidCredits ?? 0)
        );

        console.log(
          "loaded credits:",
          totalCredits,
          "free:",
          data.freeCredits,
          "paid:",
          data.paidCredits,
          "uid:",
          uid
        );
      } else {
        setCredits(0);
        console.log("no user doc found for uid:", uid);
      }
    } catch (err) {
      console.error("credits fetch error:", err);
      setCredits(0);
    }
  };

  const updateSelectedTextFromWindow = () => {
    if (typeof window === "undefined") return;

    const selection = window.getSelection();
    if (!selection) return;

    const text = selection.toString().trim();
    if (!text) return;

    const anchorNode = selection.anchorNode;
    const focusNode = selection.focusNode;

    const root = pageRootRef.current;
    if (!root) return;

    const anchorInPage = anchorNode ? root.contains(anchorNode) : false;
    const focusInPage = focusNode ? root.contains(focusNode) : false;

    if (anchorInPage || focusInPage) {
      setSelectedTextPreview(text);
    }
  };

  useEffect(() => {
    const loadCreditPacks = async () => {
      try {
        const snapshot = await getDocs(collection(db, "creditPacks"));

        const packs = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<CreditPack, "id">),
          }))
          .filter((pack) => pack.isActive)
          .sort((a, b) => a.price - b.price);

        setCreditPacks(packs);
      } catch (error) {
        console.error("creditPacks fetch error:", error);
        setAiResult("Failed to load credit packs.");
      }
    };

    loadCreditPacks();
    loadUserCredits();

    const uid = getCurrentUid();
    if (!uid) return;

    const userRef = doc(db, "users", uid);

    const unsubscribe = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const totalCredits = Number(data.credits ?? 0);

          setCredits(
            totalCredits ||
              Number(data.freeCredits ?? 0) + Number(data.paidCredits ?? 0)
          );
          console.log(
            "live credits update:",
            totalCredits,
            "free:",
            data.freeCredits,
            "paid:",
            data.paidCredits,
            "uid:",
            uid
          );
        }
      },
      (error) => {
        console.error("live credits listener error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const status = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");

    if (status === "success" && sessionId) {
      const processStripeSession = async () => {
        try {
          setAiResult("Payment successful. Finalizing credits...");

          const res = await fetch("/api/stripe-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sessionId,
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            setAiResult(data.error || "Failed to finalize credits.");
            return;
          }

          await loadUserCredits();
          setAiResult("Credits added successfully.");

          if (typeof window !== "undefined") {
            window.history.replaceState({}, "", "/dashboard/essay");
          }
        } catch (error) {
          console.error("stripe session finalize error:", error);
          setAiResult("Failed to finalize credits.");
        }
      };

      processStripeSession();
      return;
    }

    if (status === "cancelled") {
      setAiResult("Payment cancelled.");

      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/dashboard/essay");
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const handleSelectionChange = () => {
      updateSelectedTextFromWindow();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("mouseup", handleSelectionChange);
    document.addEventListener("keyup", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("mouseup", handleSelectionChange);
      document.removeEventListener("keyup", handleSelectionChange);
    };
  }, []);

  const referencesTitle =
    selectedStyle === "MLA" ? "Works Cited" : "References";

  const fullDocumentPreview = useMemo(() => {
    const lines: string[] = [];

    const cleanName = stripHtml(name);
    const cleanStudentNumber = stripHtml(studentNumber);
    const cleanTeacher = stripHtml(teacher);
    const cleanCourse = stripHtml(course);
    const cleanDate = stripHtml(date);
    const cleanTitle = stripHtml(title);

    if (selectedStyle === "MLA") {
      if (cleanName) lines.push(cleanName);
      if (cleanTeacher) lines.push(cleanTeacher);
      if (cleanCourse) lines.push(cleanCourse);
      if (cleanDate) lines.push(cleanDate);
      if (cleanTitle) lines.push("", cleanTitle);
    } else {
      if (cleanName) lines.push(cleanName);
      if (cleanStudentNumber) lines.push(cleanStudentNumber);
      if (cleanTeacher) lines.push(cleanTeacher);
      if (cleanCourse) lines.push(cleanCourse);
      if (cleanDate) lines.push(cleanDate);
      if (cleanTitle) lines.push("", cleanTitle);
    }

    const cleanIntroduction = stripHtml(introduction);
    if (cleanIntroduction) lines.push("", cleanIntroduction);

    bodyParagraphs.forEach((para) => {
      const clean = stripHtml(para.text);
      if (clean) lines.push("", clean);
    });

    const cleanConclusion = stripHtml(conclusion);
    if (cleanConclusion) lines.push("", cleanConclusion);

    const refLines = references
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (refLines.length) {
      lines.push("", referencesTitle);
      lines.push(...refLines);
    }

    return lines.join("\n");
  }, [
    selectedStyle,
    name,
    studentNumber,
    teacher,
    course,
    date,
    title,
    introduction,
    bodyParagraphs,
    conclusion,
    references,
    referencesTitle,
  ]);

  const addParagraph = () => {
    setBodyParagraphs((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: "" },
    ]);
  };

  const removeParagraph = (id: string) => {
    setBodyParagraphs((prev) => prev.filter((p) => p.id !== id));
  };

  const updateParagraph = (id: string, value: string) => {
    setBodyParagraphs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, text: value } : p))
    );
  };

  const callAi = async (text: string, mode: AiMode) => {
    const clean = stripHtml(text);
    const cost = getAiCost(mode);

    if (!clean.trim()) {
      setAiResult("Please write or select something first.");
      return;
    }

    if (credits < cost) {
      setAiResult("Not enough credits. Please buy more.");
      setShowBuyCredits(true);
      return;
    }

    try {
      setIsAiLoading(true);
      setAiResult(getAiLoadingText(mode));

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: clean,
          mode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiResult(data.error || "Something went wrong.");
        return;
      }

      setCredits((prev) => Math.max(prev - cost, 0));
      setAiResult(data.result || "No response.");
    } catch (error) {
      console.error("AI request failed:", error);
      setAiResult("Failed to connect to AI.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCheck = async (text: string) => {
    await callAi(text, "check");
  };

  const handleImprove = async (text: string) => {
    await callAi(text, "improve");
  };

  const handleShortenSelected = async () => {
    await callAi(selectedTextPreview, "shorten");
  };

  const handleExpandSelected = async () => {
    await callAi(selectedTextPreview, "expand");
  };

  const handleAcademicSelected = async () => {
    await callAi(selectedTextPreview, "academic");
  };

  const buildEssayLibraryPayload = () => ({
    id: crypto.randomUUID(),
    title: stripHtml(title) || "Untitled Essay",
    style: selectedStyle,
    createdAt: new Date().toISOString().slice(0, 10),
    content: fullDocumentPreview,
    type: "essay",
  });

  const handleExportPdf = async () => {
    const cleanTitle = stripHtml(title) || "essay";

    await exportTextToPdf({
      fileName: cleanTitle.replace(/\s+/g, "-").toLowerCase(),
      content: fullDocumentPreview,
    });

    setAiResult("PDF exported successfully.");
  };

  const handleExportDocx = async () => {
    const cleanTitle = stripHtml(title) || "essay";

    await exportTextToDocx({
      fileName: cleanTitle.replace(/\s+/g, "-").toLowerCase(),
      content: fullDocumentPreview,
    });

    setAiResult("DOCX exported successfully.");
  };

  const handleShare = async () => {
    const shareText = fullDocumentPreview.trim();

    if (!shareText) {
      setAiResult("Write something first before sharing.");
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: stripHtml(title) || "Essay",
          text: shareText,
        });
        setAiResult("Essay shared successfully.");
        return;
      }

      await navigator.clipboard.writeText(shareText);
      setAiResult("Essay copied to clipboard.");
    } catch (error) {
      console.error("Sharing failed:", error);
      setAiResult("Sharing failed.");
    }
  };

  const handleSaveToLibrary = () => {
    if (typeof window === "undefined") return;

    const payload = buildEssayLibraryPayload();
    const existingRaw = localStorage.getItem("docify_library");
    const existing = existingRaw ? JSON.parse(existingRaw) : [];

    localStorage.setItem(
      "docify_library",
      JSON.stringify([payload, ...existing])
    );

    setAiResult("Essay saved to library.");
  };

  const handlePackClick = async (pack: CreditPack) => {
    try {
      if (!pack.stripePriceId) {
        setAiResult("Missing Stripe price ID");
        return;
      }

      const uid = auth.currentUser?.uid;

      if (!uid) {
        setAiResult("User not logged in properly. Refresh and try again.");
        return;
      }

      const res = await fetch("/api/stripe-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: pack.stripePriceId,
          uid: uid,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiResult(data.error || "Checkout failed");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        setAiResult(data.error || "Checkout failed");
      }
    } catch (error) {
      console.error("Stripe error:", error);
      setAiResult("Stripe error");
    }
  };
    return (
    <div ref={pageRootRef}>
      {showBuyCredits && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Buy Credits</h2>
                <p className="text-gray-400 mt-1">
                  Choose a pack to keep using AI tools in Docify.
                </p>
              </div>

              <button
                onClick={() => setShowBuyCredits(false)}
                className="bg-neutral-800 px-4 py-2 rounded-xl font-medium"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {creditPacks.map((pack) => (
                <div
                  key={pack.id}
                  className="bg-neutral-900 rounded-2xl p-5 space-y-4 border border-neutral-800"
                >
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold">{pack.name}</h3>
                    <p className="text-gray-400">{pack.credits} credits</p>
                    <p className="text-2xl font-bold">${pack.price}</p>
                  </div>

                  <button
                    onClick={() => handlePackClick(pack)}
                    className="w-full bg-blue-500 text-white px-4 py-3 rounded-xl font-medium"
                  >
                    Buy {pack.name}
                  </button>
                </div>
              ))}
            </div>

            {creditPacks.length === 0 && (
              <div className="bg-neutral-900 rounded-2xl p-5 text-gray-400">
                No active credit packs found.
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
          <div className="min-w-0 space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Essay Builder</h1>
              <p className="text-gray-400 mt-2">
                Structured academic writing workspace for Docify.
              </p>
            </div>

            <div className="bg-neutral-900 p-5 rounded-2xl space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Essay Information</h2>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedStyle("APA")}
                    className={`px-3 py-1 rounded-lg ${
                      selectedStyle === "APA" ? "bg-blue-500" : "bg-neutral-800"
                    }`}
                  >
                    APA
                  </button>
                  <button
                    onClick={() => setSelectedStyle("MLA")}
                    className={`px-3 py-1 rounded-lg ${
                      selectedStyle === "MLA" ? "bg-blue-500" : "bg-neutral-800"
                    }`}
                  >
                    MLA
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-400">Name</p>
                <RichTextEditor
                  content={name}
                  onChange={setName}
                  onSelectionChange={setSelectedTextPreview}
                  placeholder="Write your name..."
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-400">Student #</p>
                <RichTextEditor
                  content={studentNumber}
                  onChange={setStudentNumber}
                  onSelectionChange={setSelectedTextPreview}
                  placeholder="Write your student number..."
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-400">Teacher Name</p>
                <RichTextEditor
                  content={teacher}
                  onChange={setTeacher}
                  onSelectionChange={setSelectedTextPreview}
                  placeholder="Write your teacher name..."
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-400">Course Name</p>
                <RichTextEditor
                  content={course}
                  onChange={setCourse}
                  onSelectionChange={setSelectedTextPreview}
                  placeholder="Write your course name..."
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-400">Date</p>
                <RichTextEditor
                  content={date}
                  onChange={setDate}
                  onSelectionChange={setSelectedTextPreview}
                  placeholder="Write the date..."
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-400">Essay Title</p>
                <RichTextEditor
                  content={title}
                  onChange={setTitle}
                  onSelectionChange={setSelectedTextPreview}
                  placeholder="Write your essay title..."
                />
              </div>
            </div>

            <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
              <h2 className="text-xl font-semibold">Introduction</h2>
              <RichTextEditor
                content={introduction}
                onChange={setIntroduction}
                onSelectionChange={setSelectedTextPreview}
                placeholder="Write your introduction..."
              />
              <div className="flex gap-3">
                <button
                  onClick={() => handleCheck(introduction)}
                  disabled={isAiLoading}
                  className="bg-white text-black px-4 py-2 rounded-xl font-medium disabled:opacity-60"
                >
                  Check (-1)
                </button>
                <button
                  onClick={() => handleImprove(introduction)}
                  disabled={isAiLoading}
                  className="bg-blue-500 px-4 py-2 rounded-xl font-medium disabled:opacity-60"
                >
                  Improve (-2)
                </button>
              </div>
            </div>

            <div className="bg-neutral-900 p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Body Paragraphs</h2>
                <button
                  onClick={addParagraph}
                  className="bg-blue-500 px-4 py-2 rounded-xl font-medium"
                >
                  Add Paragraph
                </button>
              </div>

              {bodyParagraphs.map((para, index) => (
                <div key={para.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="font-medium">Paragraph {index + 1}</p>
                    {bodyParagraphs.length > 1 && (
                      <button
                        onClick={() => removeParagraph(para.id)}
                        className="text-red-400 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <RichTextEditor
                    content={para.text}
                    onChange={(value) => updateParagraph(para.id, value)}
                    onSelectionChange={setSelectedTextPreview}
                    placeholder={`Write body paragraph ${index + 1}...`}
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleCheck(para.text)}
                      disabled={isAiLoading}
                      className="bg-white text-black px-4 py-2 rounded-xl font-medium disabled:opacity-60"
                    >
                      Check (-1)
                    </button>
                    <button
                      onClick={() => handleImprove(para.text)}
                      disabled={isAiLoading}
                      className="bg-blue-500 px-4 py-2 rounded-xl font-medium disabled:opacity-60"
                    >
                      Improve (-2)
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
              <h2 className="text-xl font-semibold">Conclusion</h2>
              <RichTextEditor
                content={conclusion}
                onChange={setConclusion}
                onSelectionChange={setSelectedTextPreview}
                placeholder="Write your conclusion..."
              />
              <div className="flex gap-3">
                <button
                  onClick={() => handleCheck(conclusion)}
                  disabled={isAiLoading}
                  className="bg-white text-black px-4 py-2 rounded-xl font-medium disabled:opacity-60"
                >
                  Check (-1)
                </button>
                <button
                  onClick={() => handleImprove(conclusion)}
                  disabled={isAiLoading}
                  className="bg-blue-500 px-4 py-2 rounded-xl font-medium disabled:opacity-60"
                >
                  Improve (-2)
                </button>
              </div>
            </div>

            <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
              <h2 className="text-xl font-semibold">{referencesTitle}</h2>
              <textarea
                value={references}
                onChange={(e) => setReferences(e.target.value)}
                style={{
                  fontSize: `${fontSize}px`,
                  fontFamily:
                    font === "serif"
                      ? '"Times New Roman", Times, serif'
                      : font === "sans"
                      ? "Arial, Helvetica, sans-serif"
                      : "Menlo, Monaco, monospace",
                }}
                className="w-full h-36 p-3 bg-neutral-800 rounded-xl outline-none"
                placeholder={`Add ${referencesTitle.toLowerCase()} entries, one per line...`}
              />
            </div>

            <div className="bg-neutral-900 p-5 rounded-2xl space-y-4">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExportPdf}
                  className="bg-green-600 px-4 py-3 rounded-xl font-medium"
                >
                  Export PDF
                </button>

                <button
                  onClick={handleExportDocx}
                  className="bg-blue-600 px-4 py-3 rounded-xl font-medium"
                >
                  Export DOCX
                </button>

                <button
                  onClick={handleShare}
                  className="bg-neutral-700 px-4 py-3 rounded-xl font-medium"
                >
                  Share
                </button>

                <button
                  onClick={handleSaveToLibrary}
                  className="bg-orange-500 px-4 py-3 rounded-xl font-medium"
                >
                  Save to Library
                </button>
              </div>
            </div>

            <DocumentPreview content={fullDocumentPreview} />
          </div>

          <div className="xl:sticky xl:top-6 self-start space-y-5">
            <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
              <h3 className="text-lg font-semibold">Workspace Credits</h3>
              <p className="text-3xl font-bold">{credits}</p>
              <button
                onClick={() => setShowBuyCredits(true)}
                className="w-full bg-blue-500 px-4 py-3 rounded-xl font-medium"
              >
                Buy Credits
              </button>
            </div>

            <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">Selected Text</h3>
                <button
                  onClick={() => setSelectedTextPreview("")}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Clear
                </button>
              </div>

              <p className="text-sm text-gray-400 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {selectedTextPreview || "No text selected yet."}
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCheck(selectedTextPreview)}
                  disabled={isAiLoading || !selectedTextPreview.trim()}
                  className="bg-neutral-800 px-3 py-2 rounded-lg disabled:opacity-50"
                >
                  Check
                </button>
                <button
                  onClick={() => handleImprove(selectedTextPreview)}
                  disabled={isAiLoading || !selectedTextPreview.trim()}
                  className="bg-neutral-800 px-3 py-2 rounded-lg disabled:opacity-50"
                >
                  Improve
                </button>
                <button
                  onClick={handleShortenSelected}
                  disabled={isAiLoading || !selectedTextPreview.trim()}
                  className="bg-neutral-800 px-3 py-2 rounded-lg disabled:opacity-50"
                >
                  Shorten
                </button>
                <button
                  onClick={handleExpandSelected}
                  disabled={isAiLoading || !selectedTextPreview.trim()}
                  className="bg-neutral-800 px-3 py-2 rounded-lg disabled:opacity-50"
                >
                  Expand
                </button>
                <button
                  onClick={handleAcademicSelected}
                  disabled={isAiLoading || !selectedTextPreview.trim()}
                  className="bg-neutral-800 px-3 py-2 rounded-lg disabled:opacity-50"
                >
                  Academic
                </button>
              </div>
            </div>

            <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
              <h3 className="text-lg font-semibold">AI Result</h3>
              <div className="max-h-80 overflow-y-auto">
                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                  {aiResult}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EssayPage() {
  return (
    <FormattingProvider>
      <EssayPageContent />
    </FormattingProvider>
  );
}