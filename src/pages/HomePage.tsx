import { Link, useLocation } from 'react-router';
import logo from '../assets/logo.png';
import { FORMS } from '../formContext';
import './home.css';

const forms = [FORMS['fo-en-01'], FORMS['fo-en-02']];

export default function HomePage() {
  const location = useLocation();
  const notice = (location.state as { notice?: string } | null)?.notice;
  return <div className="simple-home">
    <header className="simple-home-header">
      <div className="simple-home-brand">
        <Link to="/" aria-label="Inicio CAMCEL"><img src={logo} alt="CAMCEL IAMPP" /></Link>
        <span>Evaluación de desempeño</span>
        <nav aria-label="Menú principal" className="home-main-menu">
          <Link to="/" className="home-menu-active">Inicio</Link>
          <Link to="/formularios/fo-en-01">Auxiliar</Link>
          <Link to="/formularios/fo-en-02">Licenciado/a</Link>
        </nav>
      </div>
    </header>

    <main className="simple-home-main">
      {notice && <div role="status" className="home-save-success">✓ {notice}</div>}
      <h1>Formularios</h1>
      <p className="simple-home-intro">Elegí el formulario que necesitás completar. Podés ver el PDF y guardarlo en tu equipo.</p>
      <section className="simple-home-list" aria-label="Formularios disponibles">
        {forms.map((form) => <article className="simple-home-item" key={form.id}>
          <div className="simple-home-item-text">
            <span className="simple-home-code">{form.code}</span>
            <h2>{form.name}</h2>
          </div>
          <div className="home-item-buttons">
            <Link className="simple-home-open" to={`/formularios/${form.id}`} aria-label={`Abrir formulario de ${form.name}`}>
              Abrir formulario <span aria-hidden="true">→</span>
            </Link>
          </div>
        </article>)}
      </section>
      <p className="simple-home-note">El PDF se guarda donde elijas. CAMCEL no conserva un historial de evaluaciones.</p>
    </main>
    <footer className="simple-home-footer">CAMCEL · Enfermería</footer>
  </div>;
}
