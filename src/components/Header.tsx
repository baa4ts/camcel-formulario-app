import { Link, NavLink } from 'react-router';
import logo from '../assets/logo.png';
import { FORMS, useActiveEvaluationStore as useEvaluationStore, useCurrentForm } from '../formContext';

export default function Header({ onHistory }: { onHistory: () => void }) {
  const count = useEvaluationStore((state) => state.saved.length);
  const form = useCurrentForm();

  return <header className="topbar camcel-header">
    <Link to="/" aria-label="Volver al inicio de CAMCEL" className="brand-link">
      <img src={logo} alt="CAMCEL IAMPP" />
    </Link>
    <div className="topbar-heading">
      <h1>Evaluación de desempeño</h1>
      <p>{form.name} · {form.code}</p>
    </div>
    <nav className="camcel-menu" aria-label="Menú principal">
      <NavLink to={`/formularios/fo-en-01`} className={({isActive})=>isActive?'menu-link active':'menu-link'}>
        {FORMS['fo-en-01'].shortName}
      </NavLink>
      <NavLink to={`/formularios/fo-en-02`} className={({isActive})=>isActive?'menu-link active':'menu-link'}>
        {FORMS['fo-en-02'].shortName}
      </NavLink>
      <button type="button" className="history-top" onClick={onHistory}>
        Historial <span>{count}</span>
      </button>
    </nav>
    <Link to="/" className="header-home-button">← Volver al inicio</Link>
  </header>;
}
