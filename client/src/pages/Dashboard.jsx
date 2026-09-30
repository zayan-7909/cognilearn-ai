import { useContext, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { DocumentContext } from "../context/DocumentContext.jsx";
import PDFViewer from "../components/PDFViewer.jsx";
import MindMap from "../components/MindMap.jsx";
import FlashcardDeck from "../components/FlashcardDeck.jsx";
import ChatInterface from "../components/ChatInterface.jsx";

export default function Dashboard() {
  const { dispatch: authDispatch } = useContext(AuthContext);
  const { docState, docDispatch } = useContext(DocumentContext);
  const [docIdInput, setDocIdInput] = useState(
    docState.currentDocumentId || "",
  );
  const [uploading, setUploading] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const fileInputRef = useRef(null);

  // 1. Handle File Upload to Express Backend
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create local object URL for preview in PDFViewer immediately
    setPdfBlobUrl(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/documents/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload document");
      }

      // Automatically select the newly created document
      docDispatch({
        type: "SET_DOCUMENT",
        payload: { id: data.document.id, title: data.document.title },
      });
      setDocIdInput(data.document.id);
    } catch (err) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const applyDocument = (e) => {
    e.preventDefault();
    if (!docIdInput.trim()) return;
    docDispatch({
      type: "SET_DOCUMENT",
      payload: {
        id: docIdInput.trim(),
        title: `Doc ${docIdInput.slice(0, 8)}`,
      },
    });
  };

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100 antialiased overflow-hidden">
      {/* Navigation Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/60 px-6 backdrop-blur">
        <div className="flex items-center gap-6">
          <span className="font-extrabold tracking-wide text-blue-500 text-lg">
            CogniLearn AI
          </span>

          {/* Module Tab Selector */}
          <nav className="flex rounded-lg bg-slate-800/80 p-1 border border-slate-700/60">
            {[
              { id: "pdf", label: "Document Viewer" },
              { id: "mindmap", label: "Concept Graph" },
              { id: "flashcards", label: "Flashcards" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  docDispatch({ type: "SET_TAB", payload: tab.id })
                }
                className={`rounded-md px-3 py-1 text-xs font-semibold tracking-wide transition ${
                  docState.activeTab === tab.id
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Document Upload & Selection */}
        <div className="flex items-center gap-3">
          {/* Hidden native input triggered by the button below */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="application/pdf"
            className="hidden"
          />

          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-blue-500 disabled:opacity-50 transition"
          >
            {uploading ? "Processing PDF..." : "+ Upload PDF"}
          </button>

          <form onSubmit={applyDocument} className="flex gap-1.5">
            <input
              type="text"
              placeholder="Target Document UUID..."
              value={docIdInput}
              onChange={(e) => setDocIdInput(e.target.value)}
              className="w-56 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
            >
              Load
            </button>
          </form>

          <button
            onClick={() => authDispatch({ type: "LOGOUT" })}
            className="rounded-lg border border-slate-800 px-3 py-1 text-xs font-medium text-slate-400 hover:border-rose-900/50 hover:bg-rose-500/10 hover:text-rose-400 transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* Left Side: Active Study Tool */}
        <section className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-xl">
          {/* AFTER */}
          {docState.activeTab === "pdf" && <PDFViewer fileUrl={pdfBlobUrl} />}
          {docState.activeTab === "mindmap" && (
            <MindMap documentId={docState.currentDocumentId} />
          )}
          {docState.activeTab === "flashcards" && <FlashcardDeck />}
        </section>

        {/* Right Side: RAG Grounded Chat */}
        <section className="h-full w-96 shrink-0 shadow-xl">
          <ChatInterface
            documentId={docState.currentDocumentId}
            onSelectCitation={(page) => {
              docDispatch({ type: "SET_TAB", payload: "pdf" });
              docDispatch({ type: "SET_PAGE", payload: page });
            }}
          />
        </section>
      </main>
    </div>
  );
}
