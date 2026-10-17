import { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import './PdfPreview.css';

// PDF.js renderiza las páginas como canvas; no depende del visor PDF de WebView2.
GlobalWorkerOptions.workerSrc = pdfWorker;

function Page({ pdf, pageNumber, zoom }: {
  pdf: PDFDocumentProxy; pageNumber: number; zoom: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    let renderTask: ReturnType<PDFPageProxy['render']> | undefined;
    setError('');
    (async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;
      const canvas = ref.current;
      const context = canvas?.getContext('2d');
      if (!canvas || !context) return;
      const viewport = page.getViewport({ scale: zoom });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(viewport.width * dpr);
      canvas.height = Math.ceil(viewport.height * dpr);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      renderTask = page.render({
        canvas,
        canvasContext: context,
        viewport,
        transform: [dpr, 0, 0, dpr, 0, 0],
      });
      await renderTask.promise;
    })().catch((e: unknown) => {
      if (!cancelled && !(e instanceof Error && e.name === 'RenderingCancelledException')) {
        setError('No se pudo dibujar esta página del PDF.');
        console.error(e);
      }
    });
    return () => { cancelled = true; renderTask?.cancel(); };
  }, [pdf, pageNumber, zoom]);
  return <section className="pdf-preview-page">
    <div className="pdf-preview-page-label">Página {pageNumber} de {pdf.numPages}</div>
    <div className="pdf-preview-page-scroll"><canvas ref={ref} aria-label={`Página ${pageNumber} del PDF`} /></div>
    {error && <p className="pdf-preview-error" role="alert">{error}</p>}
  </section>;
}

export default function PdfPreview({ bytes, formTitle, onBack, onDownload, loading, status }: {
  bytes: Uint8Array<ArrayBuffer>;
  formTitle: string;
  onBack: () => void;
  onDownload: () => void;
  loading: boolean;
  status: string;
}) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1.25);

  useEffect(() => {
    let cancelled = false;
    setPdf(null);
    setError('');
    // getDocument transfiere el buffer al worker: siempre entregamos una copia.
    const task = getDocument({ data: Uint8Array.from(bytes) });
    task.promise.then((result) => {
      if (cancelled) { return; }
      setPdf(result);
    }).catch((err: unknown) => {
      if (!cancelled) {
        console.error(err);
        setError(`No se pudo cargar la vista previa: ${String(err)}`);
      }
    });
    return () => {
      cancelled = true;
      void task.destroy();
    };
  }, [bytes]);

  return <main className="pdf-preview-screen">
    <div className="pdf-preview-toolbar">
      <div className="pdf-preview-toolbar-copy">
        <h2>Vista previa del PDF</h2>
        <p>{formTitle}{pdf ? ` · ${pdf.numPages} páginas` : ''}</p>
      </div>
      <div className="pdf-preview-toolbar-actions">
        <button type="button" onClick={onBack}>← Volver al formulario</button>
        <button type="button" className="primary" onClick={onDownload} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar PDF'}
        </button>
      </div>
    </div>
    {status && <p role="status" className={status.startsWith('Error:') ? 'pdf-preview-status error' : 'pdf-preview-status'}>{status}</p>}
    <div className="pdf-preview-controls">
      <span>Vista de impresión</span>
      <div role="group" aria-label="Zoom del documento">
        <button type="button" disabled={zoom <= .75} onClick={() => setZoom((v) => Math.max(.75, v - .25))}>−</button>
        <output>{Math.round(zoom * 100)}%</output>
        <button type="button" disabled={zoom >= 2} onClick={() => setZoom((v) => Math.min(2, v + .25))}>+</button>
      </div>
    </div>
    {error && <p className="pdf-preview-error" role="alert">{error}</p>}
    {!pdf && !error && <p className="pdf-preview-wait">Preparando vista previa...</p>}
    {pdf && <div className="pdf-preview-document">
      {Array.from({ length: pdf.numPages }, (_, i) => <Page key={i} pdf={pdf} zoom={zoom} pageNumber={i + 1} />)}
    </div>}
  </main>;
}
