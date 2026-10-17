import { useFormValidation } from '../formContext';
import { validationMessage } from '../validation';

/** Visible after a save/preview/step attempt, then updates live as the user fixes fields. */
export default function ValidationNotice() {
  const { attempted, result } = useFormValidation();
  if (!attempted || result.valid) return null;
  return <div className="validation-notice" role="alert" aria-live="polite">
    <strong>Faltan datos obligatorios</strong>
    <p>{validationMessage(result)}</p>
    <p>Completados: {result.completed} de {result.totalRequired}. Los campos pendientes aparecen marcados en rojo.</p>
    {result.scoreErrors.length > 0 && <p>Hay puntajes pendientes en {result.missingBySection.filter(Boolean).length} sección(es).</p>}
  </div>;
}
