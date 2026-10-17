import type { FormId } from '../formContext';

// Zustand persist utiliza localStorage sincrónico. Verificamos que el registro
// esté realmente escrito antes de volver al inicio y limpiar el borrador.
export function verifySaved(id: string, formId: FormId): boolean {
  const key = formId === 'fo-en-02'
    ? 'camcel-licenciado-evaluaciones-v1'
    : 'camcel-evaluaciones-v1';
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null || !('state' in data)) return false;
    const state = data.state;
    if (typeof state !== 'object' || state === null || !('saved' in state)) return false;
    return Array.isArray(state.saved) && state.saved.some(
      (item: unknown) => typeof item === 'object' && item !== null && 'id' in item && item.id === id,
    );
  } catch {
    return false;
  }
}
