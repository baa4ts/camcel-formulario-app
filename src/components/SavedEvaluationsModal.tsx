import { useMemo, useState } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';

import { useActiveEvaluationStore as useEvaluationStore, useCurrentForm } from '../formContext';

function asDisplayDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('es-UY', { dateStyle: 'short', timeStyle: 'short' });
}

export default function SavedEvaluationsModal({ onClose, onLoaded }: { onClose: () => void; onLoaded?: () => void }) {
  const form=useCurrentForm();
  const saved = useEvaluationStore((state) => state.saved);
  const loadEvaluation = useEvaluationStore((state) => state.loadEvaluation);
  const deleteEvaluation = useEvaluationStore((state) => state.deleteEvaluation);
  const activeId = useEvaluationStore((state) => state.activeId);
  const draftChanged = useEvaluationStore((state) => state.draftChanged);
  const [query, setQuery] = useState('');
  const results = useMemo(() => saved.filter((item) =>
    `${item.info?.name || ''} ${item.info?.employee || ''}`.toLocaleLowerCase('es')
      .includes(query.trim().toLocaleLowerCase('es'))), [saved, query]);

  function load(id: string): void {
    if (draftChanged && !window.confirm('Tu borrador tiene cambios sin guardar como evaluación. ¿Querés cargar otra evaluación?')) return;
    if (loadEvaluation(id)) { onLoaded?.(); onClose(); }
  }
  function remove(id: string, name?: string): void {
    if (window.confirm(`¿Eliminar la evaluación guardada de ${name || 'este funcionario'}? Esta acción no se puede deshacer.`)) {
      deleteEvaluation(id);
    }
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(e: MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="saved-modal" role="dialog" aria-modal="true" aria-labelledby="saved-heading">
      <header className="saved-modal-head">
        <div><h2 id="saved-heading">Evaluaciones guardadas</h2><p>Seleccioná una para precargar todos sus datos y puntajes.</p></div>
        <button type="button" className="close-modal" onClick={onClose} aria-label="Cerrar historial">✕</button>
      </header>
      <div className="saved-search"><input autoFocus aria-label="Buscar evaluaciones guardadas" placeholder="Buscar por nombre o número de funcionario" value={query} onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} /></div>
      <div className="saved-list">
        {!saved.length && <div className="empty-history">Todavía no hay evaluaciones guardadas. Completá una y pulsá <strong>Guardar evaluación</strong>.</div>}
        {!!saved.length && !results.length && <div className="empty-history">No hay evaluaciones que coincidan con la búsqueda.</div>}
        {results.map((item) => {
          const { final } = form.calculate(item.scores || {});
          const selected = item.id === activeId;
          return <article className={`saved-item ${selected ? 'current' : ''}`} key={item.id}>
            <div className="saved-description">
              <strong>{item.info?.name?.trim() || 'Sin nombre'} {selected && <small>· abierta</small>}</strong>
              <span>Funcionario: {item.info?.employee || 'Sin número'} · Evaluación: {item.info?.date || 'Sin fecha'}</span>
              <span>Guardada: {asDisplayDate(item.updatedAt)} · Puntaje: {final === null ? 'Pendiente' : final.toFixed(2)}</span>
            </div>
            <div className="saved-buttons">
              <button type="button" className="primary" onClick={() => load(item.id)}>Cargar</button>
              <button type="button" className="danger-text" onClick={() => remove(item.id, item.info?.name)}>Eliminar</button>
            </div>
          </article>;
        })}
      </div>
      <footer className="saved-footer"><span>Guardadas solamente en esta aplicación y dispositivo.</span><button type="button" onClick={onClose}>Cerrar</button></footer>
    </section>
  </div>;
}
