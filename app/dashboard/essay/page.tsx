"use client";

import { useMemo, useState } from "react";
import DocumentPreview from "@/components/editor/DocumentPreview";
import RichTextEditor from "@/components/editor/RichTextEditor";

type BodyParagraph = {
  id: string;
  text: string;
};

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

export default function EssayPage() {
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
  const [credits, setCredits] = useState(10);
  const [selectedTextPreview] = useState("");
  const [aiResult, setAiResult] = useState("AI output will appear here.");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [bodyParagraphs, setBodyParagraphs] = useState<BodyParagraph[]>([
    { id: crypto.randomUUID(), text: "" },
  ]);

  const referencesTitle =
    selectedStyle === "MLA" ? "Works Cited" : "References";

  const fullDocumentPreview = useMemo(() => {
    const lines: string[] = [];

    if (selectedStyle === "MLA") {
      if (name) lines.push(name);
      if (teacher) lines.push(teacher);
      if (course) lines.push(course);
      if (date) lines.push(date);
      if (title) lines.push("", title);
    } else {
      if (name) lines.push(name);
      if (studentNumber) lines.push(studentNumber);
      if (teacher) lines.push(teacher);
      if (course) lines.push(course);
      if (date) lines.push(date);
      if (title) lines.push("", title);
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

  const callAi = async (
    text: string,
    mode: "check" | "improve",
    cost: number
  ) => {
    const clean = stripHtml(text);

    if (!clean.trim()) {
      setAiResult("Please write something first.");
      return;
    }

    if (credits < cost) {
      setAiResult("Not enough credits. Please buy more.");
      return;
    }

    try {
      setIsAiLoading(true);
      setAiResult(mode === "check" ? "Checking..." : "Improving...");

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

      setCredits((prev) => prev - cost);
      setAiResult(data.result || "No response.");
    } catch (error) {
      setAiResult("Failed to connect to AI.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCheck = async (text: string) => {
    await callAi(text, "check", 1);
  };

  const handleImprove = async (text: string) => {
    await callAi(text, "improve", 2);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Essay Builder</h1>
            <p className="text-gray-400 mt-2">
              Structured academic writing workspace for Docify.
            </p>
          </div>

          <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
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

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="w-full p-3 bg-neutral-800 rounded-xl outline-none"
            />
            <input
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              placeholder="Student #"
              className="w-full p-3 bg-neutral-800 rounded-xl outline-none"
            />
            <input
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="Teacher Name"
              className="w-full p-3 bg-neutral-800 rounded-xl outline-none"
            />
            <input
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="Course Name"
              className="w-full p-3 bg-neutral-800 rounded-xl outline-none"
            />
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="Date"
              className="w-full p-3 bg-neutral-800 rounded-xl outline-none"
            />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Essay Title"
              className="w-full p-3 bg-neutral-800 rounded-xl outline-none"
            />
          </div>

          <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
            <h2 className="text-xl font-semibold">Introduction</h2>
            <RichTextEditor
              content={introduction}
              onChange={setIntroduction}
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
              className="w-full h-36 p-3 bg-neutral-800 rounded-xl outline-none"
              placeholder={`Add ${referencesTitle.toLowerCase()} entries, one per line...`}
            />
          </div>

          <div className="bg-neutral-900 p-5 rounded-2xl space-y-4">
            <div className="flex flex-wrap gap-3">
              <button className="bg-green-600 px-4 py-3 rounded-xl font-medium">
                Export PDF
              </button>
              <button className="bg-blue-600 px-4 py-3 rounded-xl font-medium">
                Export DOCX
              </button>
              <button className="bg-neutral-700 px-4 py-3 rounded-xl font-medium">
                Share
              </button>
              <button className="bg-orange-500 px-4 py-3 rounded-xl font-medium">
                Save to Library
              </button>
            </div>
          </div>

          <DocumentPreview
            title={title || "Untitled Essay"}
            styleLabel={selectedStyle}
            content={fullDocumentPreview}
          />
        </div>

        <div className="space-y-5">
          <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
            <h3 className="text-lg font-semibold">Workspace Credits</h3>
            <p className="text-3xl font-bold">{credits}</p>
            <button className="w-full bg-blue-500 px-4 py-3 rounded-xl font-medium">
              Buy Credits
            </button>
          </div>

          <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
            <h3 className="text-lg font-semibold">Selected Text</h3>
            <p className="text-sm text-gray-400 whitespace-pre-wrap">
              {selectedTextPreview || "No text selected yet."}
            </p>
            <div className="flex flex-wrap gap-2">
              <button className="bg-neutral-800 px-3 py-2 rounded-lg">
                Check
              </button>
              <button className="bg-neutral-800 px-3 py-2 rounded-lg">
                Improve
              </button>
              <button className="bg-neutral-800 px-3 py-2 rounded-lg">
                Shorten
              </button>
              <button className="bg-neutral-800 px-3 py-2 rounded-lg">
                Expand
              </button>
              <button className="bg-neutral-800 px-3 py-2 rounded-lg">
                Academic
              </button>
            </div>
          </div>

          <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
            <h3 className="text-lg font-semibold">AI Result</h3>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">
              {aiResult}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}