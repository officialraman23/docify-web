"use client";

import { useState } from "react";
import DocumentPreview from "@/components/editor/DocumentPreview";

type SavedDocument = {
  id: string;
  title: string;
  content: string;
  style: "APA" | "MLA";
  createdAt: string;
};

export default function LibraryPage() {
  const [documents, setDocuments] = useState<SavedDocument[]>([
    {
      id: crypto.randomUUID(),
      title: "Climate Change Essay",
      content: `Climate change is one of the most serious global issues today.

It affects the environment, public health, and the economy in many ways. Rising temperatures, stronger storms, and sea level rise show that this problem is growing quickly.

Governments, communities, and individuals must act now to reduce emissions and protect the future.

References
United Nations. Climate Action Overview.`,
      style: "APA",
      createdAt: "2026-04-12",
    },
    {
      id: crypto.randomUUID(),
      title: "History Outline Draft",
      content: `Hook: History helps people understand how societies change over time.

Topic Introduction: Historical events influence politics, culture, and identity.

Thesis: Studying history is important because it teaches lessons, explains present systems, and helps avoid repeated mistakes.

Works Cited
Sample historical source entry.`,
      style: "MLA",
      createdAt: "2026-04-11",
    },
  ]);

  const [selectedDocument, setSelectedDocument] = useState<SavedDocument | null>(null);

  const handleOpen = (doc: SavedDocument) => {
    setSelectedDocument(doc);
  };

  const handleEdit = (doc: SavedDocument) => {
    setSelectedDocument(doc);
  };

  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));

    if (selectedDocument?.id === id) {
      setSelectedDocument(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Library</h1>
        <p className="text-gray-400 mt-2">
          Open and manage your saved Docify documents.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-6">
        <div className="space-y-5">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-neutral-900 rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{doc.title}</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {doc.style} • {doc.createdAt}
                  </p>
                </div>

                <span className="bg-neutral-800 text-sm px-3 py-1 rounded-lg">
                  {doc.style}
                </span>
              </div>

              <p className="text-sm text-gray-300 line-clamp-4">
                {doc.content}
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleOpen(doc)}
                  className="bg-white text-black px-4 py-2 rounded-xl font-medium"
                >
                  Open
                </button>

                <button
                  onClick={() => handleEdit(doc)}
                  className="bg-neutral-800 px-4 py-2 rounded-xl font-medium"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(doc.id)}
                  className="bg-red-500 px-4 py-2 rounded-xl font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <div>
          {selectedDocument ? (
            <DocumentPreview
              title={selectedDocument.title}
              styleLabel={`${selectedDocument.style} • ${selectedDocument.createdAt}`}
              content={selectedDocument.content}
            />
          ) : (
            <div className="bg-neutral-900 rounded-2xl p-6 text-gray-400">
              Select a document to preview it like a real page.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}