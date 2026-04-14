"use client";

import { useEffect, useState } from "react";
import DocumentPreview from "@/components/editor/DocumentPreview";
import { exportTextToPdf, exportTextToDocx } from "@/lib/exportUtils";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

type SavedDocument = {
  id: string;
  title: string;
  content: string;
  style: "APA" | "MLA";
  createdAt: string;
  type?: "essay" | "outline";
};

type CreditPack = {
  id: string;
  name: string;
  credits: number;
  price: number;
  isActive: boolean;
};

export default function LibraryPage() {
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<SavedDocument | null>(null);
  const [status, setStatus] = useState("");
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([]);

  // ✅ LOAD EVERYTHING
  useEffect(() => {
    const loadData = async () => {
      // local docs
      const raw = localStorage.getItem("docify_library");
      const parsed = raw ? JSON.parse(raw) : [];
      setDocuments(parsed);

      // 🔥 fetch credit packs from Firestore
      const snapshot = await getDocs(collection(db, "creditPacks"));
      const packs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<CreditPack, "id">),
      }));

      setCreditPacks(packs);
    };

    loadData();
  }, []);

  const persistDocuments = (docs: SavedDocument[]) => {
    setDocuments(docs);
    localStorage.setItem("docify_library", JSON.stringify(docs));
  };

  const handleOpen = (doc: SavedDocument) => {
    setSelectedDocument(doc);
    setStatus("");
  };

  const handleDelete = (id: string) => {
    const updated = documents.filter((doc) => doc.id !== id);
    persistDocuments(updated);

    if (selectedDocument?.id === id) {
      setSelectedDocument(null);
    }

    setStatus("Deleted successfully.");
  };

  // ✅ EXPORT PDF
  const handleExportPdf = async (doc: SavedDocument) => {
    await exportTextToPdf({
      fileName: doc.title.replace(/\s+/g, "-").toLowerCase(),
      content: doc.content,
    });

    setStatus("Exported as PDF.");
  };

  // ✅ EXPORT DOCX
  const handleExportDocx = async (doc: SavedDocument) => {
    await exportTextToDocx({
      fileName: doc.title.replace(/\s+/g, "-").toLowerCase(),
      content: doc.content,
    });

    setStatus("Exported as DOCX.");
  };

  // ✅ SHARE
  const handleShare = async (doc: SavedDocument) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: doc.title,
          text: doc.content,
        });
        return;
      }

      await navigator.clipboard.writeText(doc.content);
      setStatus("Copied to clipboard.");
    } catch {
      setStatus("Sharing failed.");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">Library</h1>
        <p className="text-gray-400 mt-2">
          Open and manage your saved Docify documents.
        </p>

        {status && (
          <p className="text-green-400 text-sm mt-2">{status}</p>
        )}
      </div>

      {/* 🔥 CREDIT PACKS PREVIEW (for next step UI) */}
      {creditPacks.length > 0 && (
        <div className="bg-neutral-900 p-5 rounded-2xl space-y-3">
          <h2 className="text-lg font-semibold">Available Credit Packs</h2>
          <div className="flex gap-3 flex-wrap">
            {creditPacks.map((pack) => (
              <div
                key={pack.id}
                className="bg-neutral-800 px-4 py-3 rounded-xl text-sm"
              >
                {pack.name} • {pack.credits} credits • ${pack.price}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-6">
        {/* LEFT SIDE */}
        <div className="space-y-5">
          {documents.length === 0 && (
            <div className="bg-neutral-900 p-5 rounded-xl text-gray-400">
              No saved documents yet.
            </div>
          )}

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

              {/* BUTTONS */}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => handleOpen(doc)}
                  className="bg-white text-black px-4 py-2 rounded-xl font-medium"
                >
                  Open
                </button>

                <button
                  onClick={() => handleExportPdf(doc)}
                  className="bg-green-600 px-4 py-2 rounded-xl font-medium"
                >
                  PDF
                </button>

                <button
                  onClick={() => handleExportDocx(doc)}
                  className="bg-blue-600 px-4 py-2 rounded-xl font-medium"
                >
                  DOCX
                </button>

                <button
                  onClick={() => handleShare(doc)}
                  className="bg-neutral-700 px-4 py-2 rounded-xl font-medium"
                >
                  Share
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

        {/* RIGHT SIDE PREVIEW */}
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