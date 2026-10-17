import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useActiveEvaluationStore as useEvaluationStore, useCurrentFormId, useFormValidation } from '../formContext';
import { verifySaved } from '../utils/verifySaved';

export default function DraftToolbar({ onHistory }: { onHistory: () => void }) {
  const navigate = useNavigate();
  const formId = useCurrentFormId();
  const [message, setMessage] = useState('');
  const { requireComplete, resetValidation } = useFormValidation();
  const activeId = useEvaluationStore((state) => state.activeId);
  const draftChanged = useEvaluationStore((state) => state.draftChanged);
  const newEvaluation = useEvaluationStore((state) => state.newEvaluation);
  const saveEvaluation = useEvaluationStore((state) => state.saveEvaluation);

  function save() {
    if (!requireComplete()) {
      setMessage('Revisá los campos obligatorios marcados en rojo antes de guardar.');
      return;
    }
    try {
      const id = saveEvaluation();
      if (!id || !verifySaved(id, formId)) throw new Error('No se confirmó el guardado local de la evaluación.');
      // Al volver a abrir un formulario se inicia una evaluación nueva.
      // La recién guardada permanece disponible en el historial.
      newEvaluation();
      resetValidation();
      navigate('/', { state: { notice: 'Evaluación guardada en el historial correctamente.' } });
    } catch (error) {
      console.error('No se pudo guardar la evaluación:', error);
      setMessage('No se pudo guardar la evaluación en el dispositivo.');
    }
  }

  function start() {
    if (draftChanged && !window.confirm('¿Crear una evaluación nueva? Los cambios del borrador actual quedarán reemplazados.')) return;
    newEvaluation();
    resetValidation();
    setMessage('Nueva evaluación iniciada.');
  }

  return <div className="draft-tools">
    <div className="draft-state">
      <strong>{activeId ? 'Evaluación cargada' : 'Nueva evaluación'}</strong>
      <span>{draftChanged ? 'Borrador guardado automáticamente · falta actualizar la evaluación guardada' : 'Borrador almacenado en esta aplicación'}</span>
    </div>
    <div className="draft-buttons">
      <button type="button" onClick={start}>+ Nueva</button>
      <button type="button" onClick={onHistory}>Historial</button>
      <button type="button" className="primary" onClick={save}>
        {activeId ? 'Actualizar evaluación y volver al inicio' : 'Guardar evaluación y volver al inicio'}
      </button>
    </div>
    {message && <p role="status" className="draft-message">{message}</p>}
  </div>;
}
