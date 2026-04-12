"use client";

import { useMemo, useState } from "react";

type BodyParagraph = {
  id: string;
  text: string;
};

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
  const [selectedTextPreview, setSelectedTextPreview] = useState("");
  const [aiResult, setAiResult] = useState("AI output will appear here.");

  const [bodyParagraphs, setBodyParagraphs] = useState<BodyParagraph[]>([
    { id: crypto.randomUUID(), text: "" },
  ]);

  const referencesTitle = selectedStyle === "MLA" ? "Works Cited" : "References";

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

    if (introduction) lines.push("", introduction);

    bodyParagraphs.forEach((para) => {
      const clean = para.text.trim();
      if (clean) lines.push("", clean);
    });

    if (conclusion) lines.push("", conclusion);

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

  const handleFakeCheck = (text: string) => {
    if (!text.trim()) {
      setAiResult("Please write something first.");
      return;
    }

    if (credits < 1) {
      setAiResult("Not enough credits. Please buy more.");
      return;
    }

    setCredits((prev) => prev - 1);
    setAiResult(
      "Check result placeholder: we will connect this to your Firebase Functions AI next."
    );
  };

  const handleFakeImprove = (text: string) => {
    if (!text.trim()) {
      setAiResult("Please write something first.");
      return;
    }

    if (credits < 2) {
      setAiResult("Not enough credits. Please buy more.");
      return;
    }

    setCredits((prev) => prev - 2);
    setAiResult(
      "Improve result placeholder: we will connect this to your Firebase Functions AI next."
    );
  };

  const handleSelectPreview = (value: string) => {
    setSelectedTextPreview(value.slice(0, 240).trim() || "No text selected yet.");
  };

  return (
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

          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full p-3 bg-neutral-800 rounded-xl outline-none" />
          <input value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} placeholder="Student #" className="w-full p-3 bg-neutral-800 rounded-xl outline-none" />
          <input value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="Teacher Name" className="w-full p-3 bg-neutral-800 rounded-xl outline-none" />
          <input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Course Name" className="w-full p-3 bg-neutral-800 rounded-xl outline-none" />
          <input value={date} onChange={(e) => setDate(e.target.value)} placeholder="Date" className="w-full p-3 bg-neutral-800 rounded-xl outline-none" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Essay Title" className="w-full p-3 bg-neutral-800 rounded-xl outline-none" />
        </div>

        <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
          <h2 className="text-xl font-semibold">Introduction</h2>
          <textarea
            value={introduction}
            onChange={(e) => setIntroduction(e.target.value)}
            onSelect={(e) => handleSelectPreview(e.currentTarget.value.substring(e.currentTarget.selectionStart, e.currentTarget.selectionEnd))}
            className="w-full h-36 p-3 bg-neutral-800 rounded-xl outline-none"
            placeholder="Write your introduction..."
          />
          <div className="flex gap-3">
            <button onClick={() => handleFakeCheck(introduction)} className="bg-white text-black px-4 py-2 rounded-xl font-medium">
              Check (-1)
            </button>
            <button onClick={() => handleFakeImprove(introduction)} className="bg-blue-500 px-4 py-2 rounded-xl font-medium">
              Improve (-2)
            </button>
          </div>
        </div>

        <div className="bg-neutral-900 p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Body Paragraphs</h2>
            <button onClick={addParagraph} className="bg-blue-500 px-4 py-2 rounded-xl font-medium">
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

              <textarea
                value={para.text}
                onChange={(e) => updateParagraph(para.id, e.target.value)}
                onSelect={(e) => handleSelectPreview(e.currentTarget.value.substring(e.currentTarget.selectionStart, e.currentTarget.selectionEnd))}
                className="w-full h-36 p-3 bg-neutral-800 rounded-xl outline-none"
                placeholder={`Write body paragraph ${index + 1}...`}
              />

              <div className="flex gap-3">
                <button onClick={() => handleFakeCheck(para.text)} className="bg-white text-black px-4 py-2 rounded-xl font-medium">
                  Check (-1)
                </button>
                <button onClick={() => handleFakeImprove(para.text)} className="bg-blue-500 px-4 py-2 rounded-xl font-medium">
                  Improve (-2)
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
          <h2 className="text-xl font-semibold">Conclusion</h2>
          <textarea
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
            onSelect={(e) => handleSelectPreview(e.currentTarget.value.substring(e.currentTarget.selectionStart, e.currentTarget.selectionEnd))}
            className="w-full h-36 p-3 bg-neutral-800 rounded-xl outline-none"
            placeholder="Write your conclusion..."
          />
          <div className="flex gap-3">
            <button onClick={() => handleFakeCheck(conclusion)} className="bg-white text-black px-4 py-2 rounded-xl font-medium">
              Check (-1)
            </button>
            <button onClick={() => handleFakeImprove(conclusion)} className="bg-blue-500 px-4 py-2 rounded-xl font-medium">
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
      </div>

      <div className="space-y-5">
        <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
          <h3 className="text-lg font-semibold">Credits</h3>
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
            <button className="bg-neutral-800 px-3 py-2 rounded-lg">Check</button>
            <button className="bg-neutral-800 px-3 py-2 rounded-lg">Improve</button>
            <button className="bg-neutral-800 px-3 py-2 rounded-lg">Shorten</button>
            <button className="bg-neutral-800 px-3 py-2 rounded-lg">Expand</button>
            <button className="bg-neutral-800 px-3 py-2 rounded-lg">Academic</button>
          </div>
        </div>

        <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
          <h3 className="text-lg font-semibold">AI Result</h3>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">
            {aiResult}
          </p>
        </div>

        <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
          <h3 className="text-lg font-semibold">Document Preview</h3>
          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans">
            {fullDocumentPreview || "Your full document preview will appear here."}
          </pre>
        </div>
      </div>
    </div>
  );
}
