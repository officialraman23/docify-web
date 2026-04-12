"use client";

import { useState } from "react";

type OutlineParagraph = {
  id: string;
  topicSentence: string;
  evidences: string[];
  anecdote: string;
};

export default function OutlinePage() {
  const [selectedStyle, setSelectedStyle] = useState<"APA" | "MLA">("APA");
  const [credits, setCredits] = useState(10);

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

  const [referenceEntries, setReferenceEntries] = useState("");
  const [aiResult, setAiResult] = useState("Outline AI output will appear here.");

  const referencesTitle = selectedStyle === "MLA" ? "Works Cited" : "References";

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
    setParagraphs((prev) => prev.filter((p) => p.id !== id));
  };

  const updateParagraph = (
    id: string,
    field: "topicSentence" | "anecdote",
    value: string
  ) => {
    setParagraphs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const updateEvidence = (id: string, evidenceIndex: number, value: string) => {
    setParagraphs((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              evidences: p.evidences.map((e, i) =>
                i === evidenceIndex ? value : e
              ),
            }
          : p
      )
    );
  };

  const addEvidence = (id: string) => {
    setParagraphs((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, evidences: [...p.evidences, ""] } : p
      )
    );
  };

  const removeEvidence = (id: string, evidenceIndex: number) => {
    setParagraphs((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              evidences: p.evidences.filter((_, i) => i !== evidenceIndex),
            }
          : p
      )
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
    setAiResult("Check result placeholder for outline. Firebase AI comes next.");
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
    setAiResult("Improve result placeholder for outline. Firebase AI comes next.");
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Outline Builder</h1>
          <p className="text-gray-400 mt-2">
            Build structured outlines before generating the essay.
          </p>
        </div>

        <div className="bg-neutral-900 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Style</h2>

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
        </div>

        <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
          <h2 className="text-xl font-semibold">Introduction</h2>

          <input value={hook} onChange={(e) => setHook(e.target.value)} placeholder="Hook" className="w-full p-3 bg-neutral-800 rounded-xl outline-none" />
          <input value={topicIntroduction} onChange={(e) => setTopicIntroduction(e.target.value)} placeholder="Topic introduction" className="w-full p-3 bg-neutral-800 rounded-xl outline-none" />
          <input value={definition} onChange={(e) => setDefinition(e.target.value)} placeholder="Definition" className="w-full p-3 bg-neutral-800 rounded-xl outline-none" />
          <input value={historicalInformation} onChange={(e) => setHistoricalInformation(e.target.value)} placeholder="Historical information" className="w-full p-3 bg-neutral-800 rounded-xl outline-none" />

          <textarea
            value={thesisStatement}
            onChange={(e) => setThesisStatement(e.target.value)}
            className="w-full h-32 p-3 bg-neutral-800 rounded-xl outline-none"
            placeholder="Thesis statement"
          />

          <div className="flex gap-3">
            <button onClick={() => handleFakeCheck(thesisStatement)} className="bg-white text-black px-4 py-2 rounded-xl font-medium">
              Check (-1)
            </button>
            <button onClick={() => handleFakeImprove(thesisStatement)} className="bg-blue-500 px-4 py-2 rounded-xl font-medium">
              Improve (-2)
            </button>
          </div>
        </div>

        <div className="bg-neutral-900 p-5 rounded-2xl space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Body Paragraphs</h2>
            <button onClick={addParagraph} className="bg-blue-500 px-4 py-2 rounded-xl font-medium">
              Add Paragraph
            </button>
          </div>

          {paragraphs.map((paragraph, paragraphIndex) => (
            <div key={paragraph.id} className="bg-neutral-800 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Body Paragraph {paragraphIndex + 1}</h3>
                {paragraphs.length > 1 && (
                  <button
                    onClick={() => removeParagraph(paragraph.id)}
                    className="text-red-400 text-sm"
                  >
                    Remove Paragraph
                  </button>
                )}
              </div>

              <input
                value={paragraph.topicSentence}
                onChange={(e) => updateParagraph(paragraph.id, "topicSentence", e.target.value)}
                placeholder="Topic sentence"
                className="w-full p-3 bg-neutral-700 rounded-xl outline-none"
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Supporting Evidence</p>
                  <button
                    onClick={() => addEvidence(paragraph.id)}
                    className="bg-neutral-700 px-3 py-2 rounded-lg text-sm"
                  >
                    Add Evidence
                  </button>
                </div>

                {paragraph.evidences.map((evidence, evidenceIndex) => (
                  <div key={evidenceIndex} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-300">
                        Evidence {evidenceIndex + 1}
                      </p>

                      {paragraph.evidences.length > 2 && (
                        <button
                          onClick={() => removeEvidence(paragraph.id, evidenceIndex)}
                          className="text-red-400 text-xs"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <textarea
                      value={evidence}
                      onChange={(e) =>
                        updateEvidence(paragraph.id, evidenceIndex, e.target.value)
                      }
                      className="w-full h-24 p-3 bg-neutral-700 rounded-xl outline-none"
                      placeholder={`Evidence ${evidenceIndex + 1}`}
                    />
                  </div>
                ))}
              </div>

              <textarea
                value={paragraph.anecdote}
                onChange={(e) => updateParagraph(paragraph.id, "anecdote", e.target.value)}
                className="w-full h-24 p-3 bg-neutral-700 rounded-xl outline-none"
                placeholder="Anecdote"
              />
            </div>
          ))}
        </div>

        <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
          <h2 className="text-xl font-semibold">Conclusion</h2>

          <textarea value={restatementOfThesis} onChange={(e) => setRestatementOfThesis(e.target.value)} className="w-full h-24 p-3 bg-neutral-800 rounded-xl outline-none" placeholder="Restatement of thesis" />
          <textarea value={summaryOfDiscussion} onChange={(e) => setSummaryOfDiscussion(e.target.value)} className="w-full h-24 p-3 bg-neutral-800 rounded-xl outline-none" placeholder="Summary of discussion" />
          <textarea value={importance1} onChange={(e) => setImportance1(e.target.value)} className="w-full h-24 p-3 bg-neutral-800 rounded-xl outline-none" placeholder="Why is this topic important? Point 1" />
          <textarea value={importance2} onChange={(e) => setImportance2(e.target.value)} className="w-full h-24 p-3 bg-neutral-800 rounded-xl outline-none" placeholder="Why is this topic important? Point 2" />
          <textarea value={recommendation1} onChange={(e) => setRecommendation1(e.target.value)} className="w-full h-24 p-3 bg-neutral-800 rounded-xl outline-none" placeholder="Recommendation / Suggestion / Advice" />
        </div>

        <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
          <h2 className="text-xl font-semibold">{referencesTitle}</h2>
          <textarea
            value={referenceEntries}
            onChange={(e) => setReferenceEntries(e.target.value)}
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
          <h3 className="text-lg font-semibold">Outline AI Result</h3>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">
            {aiResult}
          </p>
        </div>

        <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
          <button className="w-full bg-purple-600 px-4 py-3 rounded-xl font-medium">
            Generate Essay from Outline (-8)
          </button>
          <button className="w-full bg-green-600 px-4 py-3 rounded-xl font-medium">
            Export Outline
          </button>
          <button className="w-full bg-blue-600 px-4 py-3 rounded-xl font-medium">
            Export Generated Essay
          </button>
        </div>
      </div>
    </div>
  );
}