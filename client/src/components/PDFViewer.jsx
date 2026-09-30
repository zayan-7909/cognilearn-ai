import { useState, useContext } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { DocumentContext } from '../context/DocumentContext.jsx';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PDFViewer({ fileUrl }) {
  const { docState, docDispatch } = useContext(DocumentContext);
  const [numPages, setNumPages] = useState(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const changePage = (offset) => {
    const next = docState.activePage + offset;
    if (next >= 1 && next <= (numPages || 1)) {
      docDispatch({ type: 'SET_PAGE', payload: next });
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-between bg-slate-900/60 p-4">
      <div className="mb-3 flex w-full items-center justify-between border-b border-slate-800 pb-3 text-xs text-slate-400">
        <span className="font-semibold text-slate-200">
          Page {docState.activePage} of {numPages || '--'}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => changePage(-1)}
            disabled={docState.activePage <= 1}
            className="rounded bg-slate-800 px-3 py-1 font-medium hover:bg-slate-700 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            onClick={() => changePage(1)}
            disabled={docState.activePage >= (numPages || 1)}
            className="rounded bg-slate-800 px-3 py-1 font-medium hover:bg-slate-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-2 shadow-inner w-full">
        {fileUrl ? (
          <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess}>
            <Page
              pageNumber={docState.activePage}
              renderAnnotationLayer={false}
              renderTextLayer={true}
              width={520}
            />
          </Document>
        ) : (
          <div className="text-center text-sm text-slate-500">
            Load a document UUID or upload a PDF to display contents.
          </div>
        )}
      </div>
    </div>
  );
}