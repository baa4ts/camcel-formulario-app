import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import logo from '../assets/logo.png';
import { FORMS, FormProvider, useSavedCounts } from '../formContext';
import type { FormId } from '../formContext';
import SavedEvaluationsModal from '../components/SavedEvaluationsModal';
import './home.css';

const forms = [FORMS['fo-en-01'], FORMS['fo-en-02']];

export default function HomePage() {
  const counts = useSavedCounts();
  const navigate = useNavigate();
  const location = useLocation();
  const [historyFor, setHistoryFor] = useState<FormId | null>(null);
  const notice = (location.state as { notice?: string } | null)?.notice;
  const savedCount = counts.auxiliary + counts.licensed;

  function openHistory(id: FormId) {
    setHistoryFor(id);
  }

  return <div className="simple-home">
    <header className="simple-home-header">
      <div className="simple-home-brand">
        <Link to="/" aria-label="Inicio CAMCEL"><img src={logo} alt="CAMCEL IAMPP" /></Link>
        <span>Evaluación de desempeño</span>
        <nav aria-label="Menú principal" className="home-main-menu">
          <Link to="/" className="home-menu-active">Inicio</Link>
          <Link to="/formularios/fo-en-01">Auxiliar</Link>
          <Link to="/formularios/fo-en-02">Licenciado/a</Link>
          <details className="home-history-picker">
            <summary>Historial ({savedCount})</summary>
            <div className="home-history-options">
              <button type="button" onClick={() => openHistory('fo-en-01')}>Auxiliar ({counts.auxiliary})</button>
              <button type="button" onClick={() => openHistory('fo-en-02')}>Licenciado/a ({counts.licensed})</button>
            </div>
          </details>
        </nav>
      </div>
    </header>

    <main className="simple-home-main">
      {notice && <div role="status" className="home-save-success">✓ {notice}</div>}
      <h1>Formularios</h1>
      <p className="simple-home-intro">Elegí el formulario que necesitás completar o consultá las evaluaciones guardadas.</p>
      <section className="simple-home-list" aria-label="Formularios disponibles">
        {forms.map((form) => {
          const saved = form.id === 'fo-en-01' ? counts.auxiliary : counts.licensed;
          return <article className="simple-home-item" key={form.id}>
            <div className="simple-home-item-text">
              <span className="simple-home-code">{form.code}</span>
              <h2>{form.name}</h2>
              <span className="simple-home-saved">{saved === 1 ? '1 evaluación guardada' : `${saved} evaluaciones guardadas`}</span>
            </div>
            <div className="home-item-buttons">
              <button type="button" className="home-history-button" onClick={() => openHistory(form.id)}>
                Historial
              </button>
              <Link className="simple-home-open" to={`/formularios/${form.id}`} aria-label={`Abrir formulario de ${form.name}`}>
                Abrir formulario <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>;
        })}
      </section>
      <p className="simple-home-note">Las evaluaciones se guardan localmente en esta aplicación. Podés recuperarlas desde Historial.</p>
    </main>
    <footer className="simple-home-footer">CAMCEL · Enfermería</footer>

    {historyFor && <FormProvider key={historyFor} id={historyFor}>
      <SavedEvaluationsModal
        onClose={() => setHistoryFor(null)}
        onLoaded={() => { navigate(`/formularios/${historyFor}`); }}
      />
    </FormProvider>}
  </div>;
}
