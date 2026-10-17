import { useState } from 'react';
import { useActiveEvaluationStore as useEvaluationStore, useFormValidation } from '../formContext';

export default function DraftToolbar() {
  const [message, setMessage] = useState('');
  const { resetValidation } = useFormValidation();
  const draftChanged = useEvaluationStore((state) => state.draftChanged);
  const newEvaluation = useEvaluationStore((state) => state.newEvaluation);

  function start() {
    if (draftChanged && !window.confirm('¿Crear una evaluación nueva? Se descartará el borrador actual.')) return;
    newEvaluation();
    resetValidation();
    setMessage('Nueva evaluación iniciada.');
  }

  return <div className="draft-tools">
    <div className="draft-state">
      <strong>Evaluación actual</strong>
      <span>{draftChanged ? 'Borrador guardado automáticamente en este equipo' : 'Formulario listo para completar'}</span>
    </div>
    <div className="draft-buttons">
      <button type="button" onClick={start}>+ Nueva evaluación</button>
    </div>
    {message && <p role="status" className="draft-message">{message}</p>}
  </div>;
}
