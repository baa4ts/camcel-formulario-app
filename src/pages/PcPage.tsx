import { useState } from 'react';
import { Link } from 'react-router';
import Header from '../components/Header';
import ValidationNotice from '../components/ValidationNotice';
import SavedEvaluationsModal from '../components/SavedEvaluationsModal';
import DraftToolbar from '../components/DraftToolbar';
import PdfPreview from '../components/PdfPreview';
import { AllDesktopRatings, ConceptFields, FinalScore, GeneralInfo } from '../components/EvaluationForm';
import usePdfActions from '../hooks/usePdfActions';
import { useCurrentForm } from '../formContext';

export default function PcPage() {
  const form = useCurrentForm();
  const [historyOpen, setHistoryOpen] = useState(false);
  const { preview, status, loading, generate, closePreview } = usePdfActions();

  return <div className="app pc-page">
    <Header onHistory={() => setHistoryOpen(true)} />
    {preview ? <PdfPreview
      bytes={preview}
      formTitle={`${form.code} · ${form.name}`}
      onBack={closePreview}
      onDownload={() => { void generate(true); }}
      loading={loading}
      status={status}
    /> : <main className="workspace workspace-single">
      <div className="form-panel">
        <div className="panel-heading">
          <div>
            <h2>Completar evaluación</h2>
            <p>Los datos y puntajes se incorporan al PDF original sin alterar el diseño.</p>
          </div>
          <Link to="/" className="panel-home-link">← Volver al Home</Link>
        </div>
        <DraftToolbar onHistory={() => setHistoryOpen(true)} />
        <ValidationNotice />
        <GeneralInfo />
        <AllDesktopRatings />
        <ConceptFields />
        <FinalScore />
        <div className="actions">
          <button type="button" disabled={loading} onClick={() => { void generate(false); }}>
            {loading ? 'Procesando...' : 'Ver PDF completado'}
          </button>
          <button type="button" className="primary" disabled={loading} onClick={() => { void generate(true); }}>
            {loading ? 'Procesando...' : 'Guardar PDF y volver al inicio'}
          </button>
        </div>
        {status && <p role="status" className={status.startsWith('Error:') ? 'status error' : 'status'}>{status}</p>}
        <p className="hint bottom-note">Se genera localmente. Si guardás el PDF en Windows, también se añade la evaluación al historial y volvés al inicio.</p>
      </div>
    </main>}
    {historyOpen && <SavedEvaluationsModal onClose={() => setHistoryOpen(false)} />}
  </div>;
}
