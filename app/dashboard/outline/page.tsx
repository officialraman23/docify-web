"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import DocumentPreview from "@/components/editor/DocumentPreview";
import RichTextEditor from "@/components/editor/RichTextEditor";
import { exportTextToPdf, exportTextToDocx } from "@/lib/exportUtils";

type OutlineParagraph = {
  id: string;
  topicSentence: string;
  evidences: string[];
  anecdote: string;
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

export default function OutlinePage() {
  const searchParams = useSearchParams();
  const pageRootRef = useRef<HTMLDivElement | null>(null);

  const [selectedStyle, setSelectedStyle] = useState<"APA" | "MLA">("APA");
  const [credits, setCredits] = useState(0);

  const [name, setName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [teacher, setTeacher] = useState("");
  const [course, setCourse] = useState("");
  const [date, setDate] = useState("");
  const [outlineTitle, setOutlineTitle] = useState("");

  const [hook, setHook] = useState("");
  const [topicIntroduction, setTopicIntroduction] = useState("");
  const [definition, setDefinition] = useState("");
  const [historicalInformation, setHistoricalInformation] = useState("");
  const [thesisStatement, setThesisStatement] = useState("");

  const [paragraphs, setParagraphs] = useState<OutlineParagraph[]>([
    {
      id: crypto.randomUUID(),
      topicSentence: "",
      evidences: ["", ""],
      anecdote: "",
    },
    {
      id: crypto.randomUUID(),
      topicSentence: "",
      evidences: ["", ""],
      anecdote: "",
    },
    {
      id: crypto.randomUUID(),
      topicSentence: "",
      evidences: ["", ""],
      anecdote: "",
    },
  ]);

  const [restatementOfThesis, setRestatementOfThesis] = useState("");
  const [summaryOfDiscussion, setSummaryOfDiscussion] = useState("");
  const [importance1, setImportance1] = useState("");
  const [importance2, setImportance2] = useState("");
  const [recommendation1, setRecommendation1] = useState("");

  const [referenceEntries, setReferenceEntries] = useState<string[]>([""]);
  const [sourceFields, setSourceFields] = useState<string[]>([""]);

  const [fieldAIResult, setFieldAIResult] = useState(
    "Outline AI output will appear here."
  );
  const [citationAIResult, setCitationAIResult] = useState(
    "Citation helper output will appear here."
  );
  const [generatedEssay, setGeneratedEssay] = useState(
    "Generated essay will appear here."
  );

  const [isFieldAILoading, setIsFieldAILoading] = useState(false);
  const [isCitationAILoading, setIsCitationAILoading] = useState(false);
  const [isEssayGenerating, setIsEssayGenerating] = useState(false);

  const [selectedTextPreview, setSelectedTextPreview] = useState("");
  const [activeSectionLabel, setActiveSectionLabel] =
    useState("No field selected");

  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([]);
  const [showBuyCredits, setShowBuyCredits] = useState(false);

  const referencesTitle =
    selectedStyle === "MLA" ? "Works Cited" : "References";

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

        const hasSplitCredits =
          data.freeCredits !== undefined || data.paidCredits !== undefined;

        const totalCredits = hasSplitCredits
          ? Number(data.freeCredits ?? 0) + Number(data.paidCredits ?? 0)
          : Number(data.credits ?? 0);

        setCredits(totalCredits);

        console.log(
          "loaded outline credits:",
          totalCredits,
          "free:",
          data.freeCredits,
          "paid:",
          data.paidCredits,
          "legacy credits:",
          data.credits,
          "uid:",
          uid
        );
      } else {
        setCredits(0);
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
        setFieldAIResult("Failed to load credit packs.");
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

          const hasSplitCredits =
            data.freeCredits !== undefined || data.paidCredits !== undefined;

          const totalCredits = hasSplitCredits
            ? Number(data.freeCredits ?? 0) + Number(data.paidCredits ?? 0)
            : Number(data.credits ?? 0);

          setCredits(totalCredits);

          console.log(
            "live outline credits update:",
            totalCredits,
            "free:",
            data.freeCredits,
            "paid:",
            data.paidCredits,
            "legacy credits:",
            data.credits,
            "uid:",
            uid
          );
        }
      },
      (error) => {
        console.error("live outline credits listener error:", error);
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
          setFieldAIResult("Payment successful. Finalizing credits...");

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
            setFieldAIResult(data.error || "Failed to finalize credits.");
            return;
          }

          await loadUserCredits();
          setFieldAIResult("Credits added successfully.");

          if (typeof window !== "undefined") {
            window.history.replaceState({}, "", "/dashboard/outline");
          }
        } catch (error) {
          console.error("stripe session finalize error:", error);
          setFieldAIResult("Failed to finalize credits.");
        }
      };

      processStripeSession();
      return;
    }

    if (status === "cancelled") {
      setFieldAIResult("Payment cancelled.");

      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/dashboard/outline");
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

  const outlinePreview = useMemo(() => {
    const lines: string[] = [];

    if (selectedStyle === "MLA") {
      if (stripHtml(name)) lines.push(stripHtml(name));
      if (stripHtml(teacher)) lines.push(stripHtml(teacher));
      if (stripHtml(course)) lines.push(stripHtml(course));
      if (stripHtml(date)) lines.push(stripHtml(date));
      if (stripHtml(outlineTitle)) lines.push("", stripHtml(outlineTitle));
    } else {
      if (stripHtml(name)) lines.push(stripHtml(name));
      if (stripHtml(studentNumber)) lines.push(stripHtml(studentNumber));
      if (stripHtml(teacher)) lines.push(stripHtml(teacher));
      if (stripHtml(course)) lines.push(stripHtml(course));
      if (stripHtml(date)) lines.push(stripHtml(date));
      if (stripHtml(outlineTitle)) lines.push("", stripHtml(outlineTitle));
    }

    if (
      stripHtml(hook) ||
      stripHtml(topicIntroduction) ||
      stripHtml(definition) ||
      stripHtml(historicalInformation) ||
      stripHtml(thesisStatement)
    ) {
      lines.push("", "Introduction");

      if (stripHtml(hook)) lines.push(`Hook: ${stripHtml(hook)}`);
      if (stripHtml(topicIntroduction)) {
        lines.push(`Topic introduction: ${stripHtml(topicIntroduction)}`);
      }
      if (stripHtml(definition)) {
        lines.push(`Definition: ${stripHtml(definition)}`);
      }
      if (stripHtml(historicalInformation)) {
        lines.push(
          `Historical information: ${stripHtml(historicalInformation)}`
        );
      }
      if (stripHtml(thesisStatement)) {
        lines.push(`Thesis statement: ${stripHtml(thesisStatement)}`);
      }
    }

    paragraphs.forEach((paragraph, index) => {
      const hasContent =
        stripHtml(paragraph.topicSentence) ||
        paragraph.evidences.some((evidence) => stripHtml(evidence)) ||
        stripHtml(paragraph.anecdote);

      if (!hasContent) return;

      lines.push("", `Body Paragraph ${index + 1}`);

      if (stripHtml(paragraph.topicSentence)) {
        lines.push(`Topic sentence: ${stripHtml(paragraph.topicSentence)}`);
      }

      paragraph.evidences.forEach((evidence, evidenceIndex) => {
        if (stripHtml(evidence)) {
          lines.push(`Evidence ${evidenceIndex + 1}: ${stripHtml(evidence)}`);
        }
      });

      if (stripHtml(paragraph.anecdote)) {
        lines.push(`Anecdote: ${stripHtml(paragraph.anecdote)}`);
      }
    });

    if (
      stripHtml(restatementOfThesis) ||
      stripHtml(summaryOfDiscussion) ||
      stripHtml(importance1) ||
      stripHtml(importance2) ||
      stripHtml(recommendation1)
    ) {
      lines.push("", "Conclusion");

      if (stripHtml(restatementOfThesis)) {
        lines.push(
          `Restatement of thesis: ${stripHtml(restatementOfThesis)}`
        );
      }
      if (stripHtml(summaryOfDiscussion)) {
        lines.push(
          `Summary of discussion: ${stripHtml(summaryOfDiscussion)}`
        );
      }
      if (stripHtml(importance1)) {
        lines.push(`Importance point 1: ${stripHtml(importance1)}`);
      }
      if (stripHtml(importance2)) {
        lines.push(`Importance point 2: ${stripHtml(importance2)}`);
      }
      if (stripHtml(recommendation1)) {
        lines.push(`Recommendation: ${stripHtml(recommendation1)}`);
      }
    }

    const cleanedReferences = referenceEntries
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (cleanedReferences.length) {
      lines.push("", referencesTitle);
      cleanedReferences.forEach((entry) => lines.push(entry));
    }

    return lines.join("\n");
  }, [
    selectedStyle,
    name,
    studentNumber,
    teacher,
    course,
    date,
    outlineTitle,
    hook,
    topicIntroduction,
    definition,
    historicalInformation,
    thesisStatement,
    paragraphs,
    restatementOfThesis,
    summaryOfDiscussion,
    importance1,
    importance2,
    recommendation1,
    referenceEntries,
    referencesTitle,
  ]);

  const callAi = async (
    text: string,
    mode: AiMode,
    resultSetter: (value: string) => void,
    loadingSetter: (value: boolean) => void,
    customCost?: number
  ) => {
    const clean = stripHtml(text);
    const cost = customCost ?? getAiCost(mode);

    if (!clean.trim()) {
      resultSetter("Please write or select something first.");
      return;
    }

    if (credits < cost) {
      resultSetter("Not enough credits. Please buy more.");
      setShowBuyCredits(true);
      return;
    }

    try {
      loadingSetter(true);
      resultSetter(getAiLoadingText(mode));

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
        resultSetter(data.error || "Something went wrong.");
        return;
      }

      setCredits((prev) => Math.max(prev - cost, 0));
      resultSetter(data.result || "No response.");
    } catch (error) {
      console.error("AI request failed:", error);
      resultSetter("Failed to connect to AI.");
    } finally {
      loadingSetter(false);
    }
  };

  const callFieldAI = async (
    text: string,
    mode: "check" | "improve",
    context: string
  ) => {
    await callAi(
      `${context}\n\n${text}`,
      mode,
      setFieldAIResult,
      setIsFieldAILoading
    );
  };

  const runSelectedTextAI = async (mode: AiMode) => {
    await callAi(
      selectedTextPreview,
      mode,
      setFieldAIResult,
      setIsFieldAILoading
    );
  };

  const runSourceAI = async (
    index: number,
    mode: "check" | "format" | "intext"
  ) => {
    const text = sourceFields[index]?.trim();

    if (!text) {
      setCitationAIResult("Please enter source details first.");
      return;
    }

    const customCost = mode === "format" ? 3 : 2;

    await callAi(
      `${mode.toUpperCase()} citation in ${selectedStyle} style:\n\n${text}`,
      "improve",
      setCitationAIResult,
      setIsCitationAILoading,
      customCost
    );
  };

  const generateFullReferencesPage = async () => {
    const cleanedSources = sourceFields.map((s) => s.trim()).filter(Boolean);

    if (cleanedSources.length === 0) {
      setCitationAIResult("Please add at least one source first.");
      return;
    }

    if (credits < 5) {
      setCitationAIResult("Not enough credits.");
      setShowBuyCredits(true);
      return;
    }

    try {
      setIsCitationAILoading(true);
      setCitationAIResult(`Generating full ${referencesTitle} page...`);

      const prompt = `Generate a full ${referencesTitle} page in ${selectedStyle} style using these sources:\n\n${cleanedSources
        .map((source, i) => `Source ${i + 1}: ${source}`)
        .join("\n\n")}`;

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: prompt,
          mode: "improve",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCitationAIResult(data.error || "Something went wrong.");
        return;
      }

      setCredits((prev) => Math.max(prev - 5, 0));
      setCitationAIResult(data.result || "No response.");

      const lines = (data.result || "")
        .split("\n")
        .map((line: string) => line.trim())
        .filter(Boolean);

      if (lines.length) {
        setReferenceEntries(lines);
      }
    } catch (error) {
      console.error("References generation failed:", error);
      setCitationAIResult("Failed to connect to AI.");
    } finally {
      setIsCitationAILoading(false);
    }
  };
  const generateEssayFromOutline = async () => {
    if (credits < 8) {
      setGeneratedEssay("Not enough credits. Please buy more.");
      setShowBuyCredits(true);
      return;
    }

    const introBlock = `
Hook: ${stripHtml(hook)}
Topic introduction: ${stripHtml(topicIntroduction)}
Definition: ${stripHtml(definition)}
Historical information: ${stripHtml(historicalInformation)}
Thesis statement: ${stripHtml(thesisStatement)}
`.trim();

    const bodyBlock = paragraphs
      .map((paragraph, index) => {
        const evidenceText = paragraph.evidences
          .map(
            (evidence, evidenceIndex) =>
              `Evidence ${evidenceIndex + 1}: ${stripHtml(evidence)}`
          )
          .join("\n");

        return `
Body Paragraph ${index + 1}:
Topic sentence: ${stripHtml(paragraph.topicSentence)}
${evidenceText}
Anecdote: ${stripHtml(paragraph.anecdote)}
`.trim();
      })
      .join("\n\n");

    const conclusionBlock = `
Restatement of thesis: ${stripHtml(restatementOfThesis)}
Summary of discussion: ${stripHtml(summaryOfDiscussion)}
Importance point 1: ${stripHtml(importance1)}
Importance point 2: ${stripHtml(importance2)}
Recommendation: ${stripHtml(recommendation1)}
`.trim();

    const referencesBlock = referenceEntries
      .map((entry) => entry.trim())
      .filter(Boolean)
      .join("\n");

    const prompt = `
Using this academic outline, generate a full essay in ${selectedStyle} style.

Requirements:
- Write a clear introduction, body paragraphs, and conclusion.
- Follow the outline closely.
- Keep the argument structured and coherent.
- Do not invent fake citations.
- If references are provided, keep them separate at the end under ${referencesTitle}.
- Return only the final essay text.

INTRODUCTION OUTLINE:
${introBlock}

BODY OUTLINE:
${bodyBlock}

CONCLUSION OUTLINE:
${conclusionBlock}

${referencesTitle.toUpperCase()}:
${referencesBlock}
`.trim();

    try {
      setIsEssayGenerating(true);
      setGeneratedEssay("Generating essay from outline...");

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: prompt,
          mode: "improve",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGeneratedEssay(data.error || "Something went wrong.");
        return;
      }

      setCredits((prev) => Math.max(prev - 8, 0));
      setGeneratedEssay(data.result || "No response.");
    } catch (error) {
      console.error("Essay generation failed:", error);
      setGeneratedEssay("Failed to connect to AI.");
    } finally {
      setIsEssayGenerating(false);
    }
  };

  const buildOutlineLibraryPayload = () => ({
    id: crypto.randomUUID(),
    title: stripHtml(outlineTitle) || "Untitled Outline",
    style: selectedStyle,
    createdAt: new Date().toISOString().slice(0, 10),
    content: outlinePreview,
    type: "outline",
  });

  const buildGeneratedEssayLibraryPayload = () => ({
    id: crypto.randomUUID(),
    title: `${stripHtml(outlineTitle) || "Untitled Outline"} - Generated Essay`,
    style: selectedStyle,
    createdAt: new Date().toISOString().slice(0, 10),
    content: generatedEssay,
    type: "essay",
  });

  const handleExportOutlinePdf = async () => {
    if (!outlinePreview.trim()) {
      setFieldAIResult("Write something first before exporting the outline.");
      return;
    }

    await exportTextToPdf({
      fileName: (stripHtml(outlineTitle) || "outline")
        .replace(/\s+/g, "-")
        .toLowerCase(),
      content: outlinePreview,
    });

    setFieldAIResult("Outline PDF exported successfully.");
  };

  const handleExportOutlineDocx = async () => {
    if (!outlinePreview.trim()) {
      setFieldAIResult("Write something first before exporting the outline.");
      return;
    }

    await exportTextToDocx({
      fileName: (stripHtml(outlineTitle) || "outline")
        .replace(/\s+/g, "-")
        .toLowerCase(),
      content: outlinePreview,
    });

    setFieldAIResult("Outline DOCX exported successfully.");
  };

  const handleExportGeneratedEssayPdf = async () => {
    const cleanEssay = generatedEssay.trim();

    if (!cleanEssay || cleanEssay === "Generated essay will appear here.") {
      setGeneratedEssay("Generate the essay first before exporting.");
      return;
    }

    await exportTextToPdf({
      fileName: `${(stripHtml(outlineTitle) || "generated-essay")
        .replace(/\s+/g, "-")
        .toLowerCase()}-generated`,
      content: cleanEssay,
    });

    setGeneratedEssay("Generated essay PDF exported successfully.");
  };

  const handleExportGeneratedEssayDocx = async () => {
    const cleanEssay = generatedEssay.trim();

    if (!cleanEssay || cleanEssay === "Generated essay will appear here.") {
      setGeneratedEssay("Generate the essay first before exporting.");
      return;
    }

    await exportTextToDocx({
      fileName: `${(stripHtml(outlineTitle) || "generated-essay")
        .replace(/\s+/g, "-")
        .toLowerCase()}-generated`,
      content: cleanEssay,
    });

    setGeneratedEssay("Generated essay DOCX exported successfully.");
  };

  const handleShareOutline = async () => {
    const shareText = outlinePreview.trim();

    if (!shareText) {
      setFieldAIResult("Write something first before sharing the outline.");
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: stripHtml(outlineTitle) || "Outline",
          text: shareText,
        });
        setFieldAIResult("Outline shared successfully.");
        return;
      }

      await navigator.clipboard.writeText(shareText);
      setFieldAIResult("Outline copied to clipboard.");
    } catch (error) {
      console.error("Sharing outline failed:", error);
      setFieldAIResult("Sharing outline failed.");
    }
  };

  const handleShareGeneratedEssay = async () => {
    const shareText = generatedEssay.trim();

    if (!shareText || shareText === "Generated essay will appear here.") {
      setGeneratedEssay("Generate the essay first before sharing.");
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${stripHtml(outlineTitle) || "Outline"} - Generated Essay`,
          text: shareText,
        });
        setGeneratedEssay("Generated essay shared successfully.");
        return;
      }

      await navigator.clipboard.writeText(shareText);
      setGeneratedEssay("Generated essay copied to clipboard.");
    } catch (error) {
      console.error("Sharing generated essay failed:", error);
      setGeneratedEssay("Sharing generated essay failed.");
    }
  };

  const handleSaveOutlineToLibrary = () => {
    if (typeof window === "undefined") return;

    if (!outlinePreview.trim()) {
      setFieldAIResult("Write something first before saving the outline.");
      return;
    }

    const payload = buildOutlineLibraryPayload();
    const existingRaw = localStorage.getItem("docify_library");
    const existing = existingRaw ? JSON.parse(existingRaw) : [];

    localStorage.setItem(
      "docify_library",
      JSON.stringify([payload, ...existing])
    );

    setFieldAIResult("Outline saved to library.");
  };

  const handleSaveGeneratedEssayToLibrary = () => {
    if (typeof window === "undefined") return;

    const cleanEssay = generatedEssay.trim();

    if (!cleanEssay || cleanEssay === "Generated essay will appear here.") {
      setGeneratedEssay("Generate the essay first before saving.");
      return;
    }

    const payload = buildGeneratedEssayLibraryPayload();
    const existingRaw = localStorage.getItem("docify_library");
    const existing = existingRaw ? JSON.parse(existingRaw) : [];

    localStorage.setItem(
      "docify_library",
      JSON.stringify([payload, ...existing])
    );

    setGeneratedEssay("Generated essay saved to library.");
  };

  const handlePackClick = async (pack: CreditPack) => {
    try {
      if (!pack.stripePriceId) {
        setFieldAIResult("Missing Stripe price ID");
        return;
      }

      const uid = auth.currentUser?.uid;

      if (!uid) {
        setFieldAIResult("User not logged in properly. Refresh and try again.");
        return;
      }

      const res = await fetch("/api/stripe-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: pack.stripePriceId,
          uid,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFieldAIResult(data.error || "Checkout failed");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        setFieldAIResult(data.error || "Checkout failed");
      }
    } catch (error) {
      console.error("Stripe error:", error);
      setFieldAIResult("Stripe error");
    }
  };

  const updateParagraphField = (
    paragraphIndex: number,
    field: "topicSentence" | "anecdote",
    value: string
  ) => {
    setParagraphs((prev) =>
      prev.map((paragraph, index) =>
        index === paragraphIndex ? { ...paragraph, [field]: value } : paragraph
      )
    );
  };

  const updateEvidence = (
    paragraphIndex: number,
    evidenceIndex: number,
    value: string
  ) => {
    setParagraphs((prev) =>
      prev.map((paragraph, index) =>
        index === paragraphIndex
          ? {
              ...paragraph,
              evidences: paragraph.evidences.map((evidence, i) =>
                i === evidenceIndex ? value : evidence
              ),
            }
          : paragraph
      )
    );
  };

  const addParagraph = () => {
    setParagraphs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        topicSentence: "",
        evidences: ["", ""],
        anecdote: "",
      },
    ]);
  };

  const removeParagraph = (id: string) => {
    setParagraphs((prev) => prev.filter((paragraph) => paragraph.id !== id));
  };

  const addEvidence = (paragraphIndex: number) => {
    setParagraphs((prev) =>
      prev.map((paragraph, index) =>
        index === paragraphIndex
          ? { ...paragraph, evidences: [...paragraph.evidences, ""] }
          : paragraph
      )
    );
  };

  const removeEvidence = (paragraphIndex: number, evidenceIndex: number) => {
    setParagraphs((prev) =>
      prev.map((paragraph, index) =>
        index === paragraphIndex
          ? {
              ...paragraph,
              evidences: paragraph.evidences.filter(
                (_, i) => i !== evidenceIndex
              ),
            }
          : paragraph
      )
    );
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

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
  <div className="min-w-0 space-y-6">
    <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
      <h1 className="text-3xl font-bold">Outline</h1>
      <p className="text-gray-400">
        Build your essay outline, improve sections with AI, and generate
        citations from sources.
      </p>
      <p className="text-sm text-blue-400">
        Currently Editing: {activeSectionLabel}
      </p>
    </div>

        <div className="bg-neutral-900 p-5 rounded-2xl flex flex-wrap gap-3">
          <button
            onClick={generateEssayFromOutline}
            disabled={isEssayGenerating}
            className="bg-purple-600 px-4 py-3 rounded-xl font-medium disabled:opacity-60"
          >
            Generate Essay from Outline (-8)
          </button>

          <button
            onClick={handleExportOutlinePdf}
            className="bg-green-600 px-4 py-3 rounded-xl font-medium"
          >
            Export Outline PDF
          </button>

          <button
            onClick={handleExportOutlineDocx}
            className="bg-blue-600 px-4 py-3 rounded-xl font-medium"
          >
            Export Outline DOCX
          </button>

          <button
            onClick={handleShareOutline}
            className="bg-neutral-700 px-4 py-3 rounded-xl font-medium"
          >
            Share Outline
          </button>

          <button
            onClick={handleSaveOutlineToLibrary}
            className="bg-orange-500 px-4 py-3 rounded-xl font-medium"
          >
            Save Outline to Library
          </button>

          <button
            onClick={handleExportGeneratedEssayPdf}
            className="bg-green-700 px-4 py-3 rounded-xl font-medium"
          >
            Export Essay PDF
          </button>

          <button
            onClick={handleExportGeneratedEssayDocx}
            className="bg-blue-700 px-4 py-3 rounded-xl font-medium"
          >
            Export Essay DOCX
          </button>

          <button
            onClick={handleShareGeneratedEssay}
            className="bg-neutral-600 px-4 py-3 rounded-xl font-medium"
          >
            Share Essay
          </button>

          <button
            onClick={handleSaveGeneratedEssayToLibrary}
            className="bg-orange-600 px-4 py-3 rounded-xl font-medium"
          >
            Save Essay to Library
          </button>
        </div>

        <div className="bg-neutral-900 p-5 rounded-2xl space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Outline Information</h2>

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
            <p className="text-sm text-gray-400">Outline Title</p>
            <RichTextEditor
              content={outlineTitle}
              onChange={setOutlineTitle}
              onSelectionChange={setSelectedTextPreview}
              placeholder="Write your outline title..."
            />
          </div>
        </div>

        <div className="bg-neutral-900 p-5 rounded-2xl space-y-4">
          <h2 className="text-xl font-semibold">Introduction</h2>

          <div className="space-y-2">
            <p className="text-sm text-gray-400">Hook</p>
            <input
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              onFocus={() => setActiveSectionLabel("Hook")}
              className="w-full p-3 bg-neutral-800 rounded-xl outline-none"
              placeholder="Hook"
            />
            <div className="flex gap-3">
              <button
                onClick={() => callFieldAI(hook, "check", "Hook")}
                disabled={isFieldAILoading}
                className="bg-white text-black px-4 py-2 rounded-xl font-medium disabled:opacity-60"
              >
                Check (-1)
              </button>
              <button
                onClick={() => callFieldAI(hook, "improve", "Hook")}
                disabled={isFieldAILoading}
                className="bg-blue-500 px-4 py-2 rounded-xl font-medium disabled:opacity-60"
              >
                Improve (-2)
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-400">Topic introduction</p>
            <input
              value={topicIntroduction}
              onChange={(e) => setTopicIntroduction(e.target.value)}
              onFocus={() => setActiveSectionLabel("Topic introduction")}
              className="w-full p-3 bg-neutral-800 rounded-xl outline-none"
              placeholder="Topic introduction"
            />
            <div className="flex gap-3">
              <button
                onClick={() =>
                  callFieldAI(topicIntroduction, "check", "Topic introduction")
                }
                disabled={isFieldAILoading}
                className="bg-white text-black px-4 py-2 rounded-xl font-medium disabled:opacity-60"
              >
                Check (-1)
              </button>
              <button
                onClick={() =>
                  callFieldAI(
                    topicIntroduction,
                    "improve",
                    "Topic introduction"
                  )
                }
                disabled={isFieldAILoading}
                className="bg-blue-500 px-4 py-2 rounded-xl font-medium disabled:opacity-60"
              >
                Improve (-2)
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-400">Definition</p>
            <input
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              onFocus={() => setActiveSectionLabel("Definition")}
              className="w-full p-3 bg-neutral-800 rounded-xl outline-none"
              placeholder="Definition"
            />
            <div className="flex gap-3">
              <button
                onClick={() => callFieldAI(definition, "check", "Definition")}
                disabled={isFieldAILoading}
                className="bg-white text-black px-4 py-2 rounded-xl font-medium disabled:opacity-60"
              >
                Check (-1)
              </button>
              <button
                onClick={() => callFieldAI(definition, "improve", "Definition")}
                disabled={isFieldAILoading}
                className="bg-blue-500 px-4 py-2 rounded-xl font-medium disabled:opacity-60"
              >
                Improve (-2)
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-400">Historical information</p>
            <input
              value={historicalInformation}
              onChange={(e) => setHistoricalInformation(e.target.value)}
              onFocus={() => setActiveSectionLabel("Historical information")}
              className="w-full p-3 bg-neutral-800 rounded-xl outline-none"
              placeholder="Historical information"
            />
            <div className="flex gap-3">
              <button
                onClick={() =>
                  callFieldAI(
                    historicalInformation,
                    "check",
                    "Historical information"
                  )
                }
                disabled={isFieldAILoading}
                className="bg-white text-black px-4 py-2 rounded-xl font-medium disabled:opacity-60"
              >
                Check (-1)
              </button>
              <button
                onClick={() =>
                  callFieldAI(
                    historicalInformation,
                    "improve",
                    "Historical information"
                  )
                }
                disabled={isFieldAILoading}
                className="bg-blue-500 px-4 py-2 rounded-xl font-medium disabled:opacity-60"
              >
                Improve (-2)
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Thesis statement (your claim and three reasons)
            </p>
            <RichTextEditor
              content={thesisStatement}
              onChange={setThesisStatement}
              onSelectionChange={setSelectedTextPreview}
              placeholder="Thesis statement (your claim and three reasons)"
            />
            <div className="flex gap-3">
              <button
                onClick={() =>
                  callFieldAI(thesisStatement, "check", "Thesis statement")
                }
                disabled={isFieldAILoading}
                className="bg-white text-black px-4 py-2 rounded-xl font-medium disabled:opacity-60"
              >
                Check (-1)
              </button>
              <button
                onClick={() =>
                  callFieldAI(thesisStatement, "improve", "Thesis statement")
                }
                disabled={isFieldAILoading}
                className="bg-blue-500 px-4 py-2 rounded-xl font-medium disabled:opacity-60"
              >
                Improve (-2)
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Body Paragraphs</h2>
            <button
              onClick={addParagraph}
              className="bg-blue-500 px-4 py-2 rounded-xl font-medium"
            >
              Add Paragraph
            </button>
          </div>

          {paragraphs.map((paragraph, paragraphIndex) => (
            <div
              key={paragraph.id}
              className="bg-neutral-900 p-5 rounded-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{`${
                  paragraphIndex + 1
                }${
                  paragraphIndex === 0
                    ? "st"
                    : paragraphIndex === 1
                    ? "nd"
                    : paragraphIndex === 2
                    ? "rd"
                    : "th"
                } Body Paragraph`}</h3>
                {paragraphs.length > 1 && (
                  <button
                    onClick={() => removeParagraph(paragraph.id)}
                    className="text-red-400 text-sm"
                  >
                    Remove Paragraph
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-400">Topic sentence</p>
                <input
                  value={paragraph.topicSentence}
                  onChange={(e) =>
                    updateParagraphField(
                      paragraphIndex,
                      "topicSentence",
                      e.target.value
                    )
                  }
                  onFocus={() =>
                    setActiveSectionLabel(
                      `Body Paragraph ${paragraphIndex + 1} Topic sentence`
                    )
                  }
                  className="w-full p-3 bg-neutral-800 rounded-xl outline-none"
                  placeholder="Topic sentence"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      callFieldAI(
                        paragraph.topicSentence,
                        "check",
                        `Body Paragraph ${paragraphIndex + 1} Topic sentence`
                      )
                    }
                    disabled={isFieldAILoading}
                    className="bg-white text-black px-4 py-2 rounded-xl font-medium disabled:opacity-60"
                  >
                    Check (-1)
                  </button>
                  <button
                    onClick={() =>
                      callFieldAI(
                        paragraph.topicSentence,
                        "improve",
                        `Body Paragraph ${paragraphIndex + 1} Topic sentence`
                      )
                    }
                    disabled={isFieldAILoading}
                    className="bg-blue-500 px-4 py-2 rounded-xl font-medium disabled:opacity-60"
                  >
                    Improve (-2)
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold">
                    Supporting points / Evidence
                  </p>
                  <button
                    onClick={() => addEvidence(paragraphIndex)}
                    className="bg-neutral-800 px-3 py-2 rounded-lg"
                  >
                    Add Evidence
                  </button>
                </div>

                {paragraph.evidences.map((evidence, evidenceIndex) => (
                  <div key={evidenceIndex} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400">{`Evidence ${
                        evidenceIndex + 1
                      } (quote/source)`}</p>
                      {paragraph.evidences.length > 2 && (
                        <button
                          onClick={() =>
                            removeEvidence(paragraphIndex, evidenceIndex)
                          }
                          className="text-red-400 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <RichTextEditor
                      content={evidence}
                      onChange={(value) =>
                        updateEvidence(paragraphIndex, evidenceIndex, value)
                      }
                      onSelectionChange={setSelectedTextPreview}
                      placeholder={`Evidence ${
                        evidenceIndex + 1
                      } (quote/source)`}
                    />

                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          callFieldAI(
                            evidence,
                            "check",
                            `Evidence ${
                              evidenceIndex + 1
                            } for Body Paragraph ${paragraphIndex + 1}`
                          )
                        }
                        disabled={isFieldAILoading}
                        className="bg-white text-black px-4 py-2 rounded-xl font-medium disabled:opacity-60"
                      >
                        Check (-1)
                      </button>
                      <button
                        onClick={() =>
                          callFieldAI(
                            evidence,
                            "improve",
                            `Evidence ${
                              evidenceIndex + 1
                            } for Body Paragraph ${paragraphIndex + 1}`
                          )
                        }
                        disabled={isFieldAILoading}
                        className="bg-blue-500 px-4 py-2 rounded-xl font-medium disabled:opacity-60"
                      >
                        Improve (-2)
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-400">Anecdote</p>
                <RichTextEditor
                  content={paragraph.anecdote}
                  onChange={(value) =>
                    updateParagraphField(paragraphIndex, "anecdote", value)
                  }
                  onSelectionChange={setSelectedTextPreview}
                  placeholder="Anecdote"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      callFieldAI(
                        paragraph.anecdote,
                        "check",
                        `Body Paragraph ${paragraphIndex + 1} Anecdote`
                      )
                    }
                    disabled={isFieldAILoading}
                    className="bg-white text-black px-4 py-2 rounded-xl font-medium disabled:opacity-60"
                  >
                    Check (-1)
                  </button>
                  <button
                    onClick={() =>
                      callFieldAI(
                        paragraph.anecdote,
                        "improve",
                        `Body Paragraph ${paragraphIndex + 1} Anecdote`
                      )
                    }
                    disabled={isFieldAILoading}
                    className="bg-blue-500 px-4 py-2 rounded-xl font-medium disabled:opacity-60"
                  >
                    Improve (-2)
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      <div className="bg-neutral-900 p-5 rounded-2xl space-y-4">
        <h2 className="text-xl font-semibold">Conclusion</h2>

        <div className="space-y-2">
          <p className="text-sm text-gray-400">Restatement of thesis</p>
          <RichTextEditor
            content={restatementOfThesis}
            onChange={setRestatementOfThesis}
            onSelectionChange={setSelectedTextPreview}
            placeholder="Restatement of thesis"
          />
          <div className="flex gap-3">
            <button
              onClick={() =>
                callFieldAI(
                  restatementOfThesis,
                  "check",
                  "Restatement of thesis"
                )
              }
              disabled={isFieldAILoading}
              className="bg-white text-black px-4 py-2 rounded-xl font-medium disabled:opacity-60"
            >
              Check (-1)
            </button>
            <button
              onClick={() =>
                callFieldAI(
                  restatementOfThesis,
                  "improve",
                  "Restatement of thesis"
                )
              }
              disabled={isFieldAILoading}
              className="bg-blue-500 px-4 py-2 rounded-xl font-medium disabled:opacity-60"
            >
              Improve (-2)
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-400">Summary of what you discussed</p>
          <RichTextEditor
            content={summaryOfDiscussion}
            onChange={setSummaryOfDiscussion}
            onSelectionChange={setSelectedTextPreview}
            placeholder="Summary of what you discussed"
          />
          <div className="flex gap-3">
            <button
              onClick={() =>
                callFieldAI(
                  summaryOfDiscussion,
                  "check",
                  "Summary of discussion"
                )
              }
              disabled={isFieldAILoading}
              className="bg-white text-black px-4 py-2 rounded-xl font-medium disabled:opacity-60"
            >
              Check (-1)
            </button>
            <button
              onClick={() =>
                callFieldAI(
                  summaryOfDiscussion,
                  "improve",
                  "Summary of discussion"
                )
              }
              disabled={isFieldAILoading}
              className="bg-blue-500 px-4 py-2 rounded-xl font-medium disabled:opacity-60"
            >
              Improve (-2)
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-400">
            Why is this topic important? Point 1
          </p>
          <RichTextEditor
            content={importance1}
            onChange={setImportance1}
            onSelectionChange={setSelectedTextPreview}
            placeholder="Why is this topic important? Point 1"
          />
          <div className="flex gap-3">
            <button
              onClick={() =>
                callFieldAI(importance1, "check", "Importance point 1")
              }
              disabled={isFieldAILoading}
              className="bg-white text-black px-4 py-2 rounded-xl font-medium disabled:opacity-60"
            >
              Check (-1)
            </button>
            <button
              onClick={() =>
                callFieldAI(importance1, "improve", "Importance point 1")
              }
              disabled={isFieldAILoading}
              className="bg-blue-500 px-4 py-2 rounded-xl font-medium disabled:opacity-60"
            >
              Improve (-2)
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-400">
            Why is this topic important? Point 2
          </p>
          <RichTextEditor
            content={importance2}
            onChange={setImportance2}
            onSelectionChange={setSelectedTextPreview}
            placeholder="Why is this topic important? Point 2"
          />
          <div className="flex gap-3">
            <button
              onClick={() =>
                callFieldAI(importance2, "check", "Importance point 2")
              }
              disabled={isFieldAILoading}
              className="bg-white text-black px-4 py-2 rounded-xl font-medium disabled:opacity-60"
            >
              Check (-1)
            </button>
            <button
              onClick={() =>
                callFieldAI(importance2, "improve", "Importance point 2")
              }
              disabled={isFieldAILoading}
              className="bg-blue-500 px-4 py-2 rounded-xl font-medium disabled:opacity-60"
            >
              Improve (-2)
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-400">
            Recommendation / Suggestion / Advice
          </p>
          <RichTextEditor
            content={recommendation1}
            onChange={setRecommendation1}
            onSelectionChange={setSelectedTextPreview}
            placeholder="Recommendation / Suggestion / Advice"
          />
          <div className="flex gap-3">
            <button
              onClick={() =>
                callFieldAI(recommendation1, "check", "Recommendation")
              }
              disabled={isFieldAILoading}
              className="bg-white text-black px-4 py-2 rounded-xl font-medium disabled:opacity-60"
            >
              Check (-1)
            </button>
            <button
              onClick={() =>
                callFieldAI(recommendation1, "improve", "Recommendation")
              }
              disabled={isFieldAILoading}
              className="bg-blue-500 px-4 py-2 rounded-xl font-medium disabled:opacity-60"
            >
              Improve (-2)
            </button>
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 p-5 rounded-2xl space-y-4">
        <h2 className="text-xl font-semibold">{referencesTitle}</h2>

        {referenceEntries.map((entry, index) => (
          <div key={index} className="space-y-2">
            <textarea
              value={entry}
              onChange={(e) =>
                setReferenceEntries((prev) =>
                  prev.map((item, i) => (i === index ? e.target.value : item))
                )
              }
              className="w-full h-28 p-3 bg-neutral-800 rounded-xl outline-none"
              placeholder={`${referencesTitle} entry ${index + 1}`}
            />
          </div>
        ))}

        <button
          onClick={() => setReferenceEntries((prev) => [...prev, ""])}
          className="bg-neutral-800 px-4 py-2 rounded-xl"
        >
          Add Reference Entry
        </button>
      </div>

      <div className="bg-neutral-900 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Citation Helper</h2>
          <button
            onClick={() => setSourceFields((prev) => [...prev, ""])}
            className="bg-neutral-800 px-4 py-2 rounded-xl"
          >
            Add Source Field
          </button>
        </div>

        <p className="text-gray-400">
          Paste links, raw source details, article info, or book details. Use AI
          to generate in-text citations or a full {referencesTitle} page.
        </p>

        {sourceFields.map((source, index) => (
          <div
            key={index}
            className="bg-neutral-800 p-4 rounded-2xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold">Source {index + 1}</p>
              {sourceFields.length > 1 && (
                <button
                  onClick={() =>
                    setSourceFields((prev) =>
                      prev.filter((_, i) => i !== index)
                    )
                  }
                  className="text-red-400 text-sm"
                >
                  Remove
                </button>
              )}
            </div>

            <textarea
              value={source}
              onChange={(e) =>
                setSourceFields((prev) =>
                  prev.map((item, i) => (i === index ? e.target.value : item))
                )
              }
              onFocus={() => setActiveSectionLabel(`Source ${index + 1}`)}
              className="w-full h-28 p-3 bg-neutral-900 rounded-xl outline-none"
              placeholder={`Source ${index + 1}`}
            />

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => runSourceAI(index, "check")}
                disabled={isCitationAILoading}
                className="bg-white text-black px-4 py-2 rounded-xl font-medium disabled:opacity-60"
              >
                Check Citation (-2)
              </button>
              <button
                onClick={() => runSourceAI(index, "format")}
                disabled={isCitationAILoading}
                className="bg-blue-500 px-4 py-2 rounded-xl font-medium disabled:opacity-60"
              >
                Format Citation (-3)
              </button>
              <button
                onClick={() => runSourceAI(index, "intext")}
                disabled={isCitationAILoading}
                className="bg-purple-500 px-4 py-2 rounded-xl font-medium disabled:opacity-60"
              >
                In-Text Citation (-2)
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={generateFullReferencesPage}
          disabled={isCitationAILoading}
          className="bg-green-600 px-4 py-3 rounded-xl font-medium disabled:opacity-60"
        >
          Generate Full {referencesTitle} Page (-5)
        </button>
      </div>

                      <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
            <h3 className="text-lg font-semibold">Outline Preview</h3>
            <DocumentPreview content={outlinePreview} />
          </div>

          <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
            <h3 className="text-lg font-semibold">Citation Helper Result</h3>
            <div className="max-h-72 overflow-y-auto">
              <p className="text-sm text-gray-300 whitespace-pre-wrap">
                {citationAIResult}
              </p>
            </div>
          </div>

          <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
            <h3 className="text-lg font-semibold">Generated Essay</h3>
            <div className="max-h-80 overflow-y-auto">
              <p className="text-sm text-gray-300 whitespace-pre-wrap">
                {generatedEssay}
              </p>
            </div>
          </div>
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
                onClick={() => runSelectedTextAI("check")}
                disabled={isFieldAILoading || !selectedTextPreview.trim()}
                className="bg-neutral-800 px-3 py-2 rounded-lg disabled:opacity-50"
              >
                Check
              </button>
              <button
                onClick={() => runSelectedTextAI("improve")}
                disabled={isFieldAILoading || !selectedTextPreview.trim()}
                className="bg-neutral-800 px-3 py-2 rounded-lg disabled:opacity-50"
              >
                Improve
              </button>
              <button
                onClick={() => runSelectedTextAI("shorten")}
                disabled={isFieldAILoading || !selectedTextPreview.trim()}
                className="bg-neutral-800 px-3 py-2 rounded-lg disabled:opacity-50"
              >
                Shorten
              </button>
              <button
                onClick={() => runSelectedTextAI("expand")}
                disabled={isFieldAILoading || !selectedTextPreview.trim()}
                className="bg-neutral-800 px-3 py-2 rounded-lg disabled:opacity-50"
              >
                Expand
              </button>
              <button
                onClick={() => runSelectedTextAI("academic")}
                disabled={isFieldAILoading || !selectedTextPreview.trim()}
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
                {fieldAIResult}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}