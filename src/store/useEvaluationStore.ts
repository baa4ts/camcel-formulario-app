import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { EvaluationInfo, EvaluationStoreState, PersistedEvaluationState, Scores } from '../types';

const pad = (value: number): string => String(value).padStart(2, '0');
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function emptyInfo(): EvaluationInfo {
  return {
    name: '', employee: '', date: todayISO(), start: '', end: '',
    concept: '', evaluator: '', evaluated: '',
  };
}
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
function normalizeInfo(value: unknown): EvaluationInfo {
  const fallback = emptyInfo();
  if (!isObject(value)) return fallback;
  for (const key of Object.keys(fallback) as (keyof EvaluationInfo)[]) {
    if (typeof value[key] === 'string') fallback[key] = value[key] as string;
  }
  return fallback;
}
function normalizeScores(value: unknown): Scores {
  if (!isObject(value)) return {};
  const scores: Scores = {};
  for (const [key, score] of Object.entries(value)) {
    if (/^\d+-\d+$/.test(key) && ['1', '2', '3', '4', '5'].includes(String(score))) {
      scores[key as keyof Scores] = String(score) as NonNullable<Scores[keyof Scores]>;
    }
  }
  return scores;
}

/** Draft-only storage: completed evaluations never enter localStorage. */
export const useEvaluationStore = create<EvaluationStoreState>()(
  persist<EvaluationStoreState, [], [], PersistedEvaluationState>(
    (set) => ({
      info: emptyInfo(), scores: {}, draftChanged: false,
      updateField: (key, value) => set((state) => ({
        info: { ...state.info, [key]: value }, draftChanged: true,
      })),
      updateScore: (key, value) => set((state) => {
        const scores: Scores = { ...state.scores };
        if (!value) delete scores[key];
        else scores[key] = value;
        return { scores, draftChanged: true };
      }),
      newEvaluation: () => set({ info: emptyInfo(), scores: {}, draftChanged: false }),
    }),
    {
      // New key: do not load or deserialize historical evaluation records.
      name: 'camcel-borrador-auxiliar-v1',
      storage: createJSONStorage<PersistedEvaluationState>(() => localStorage),
      version: 1,
      partialize: (state): PersistedEvaluationState => ({
        info: state.info, scores: state.scores, draftChanged: state.draftChanged,
      }),
      merge: (stored: unknown, current): EvaluationStoreState => {
        const data = isObject(stored) ? stored : {};
        return {
          ...current,
          info: normalizeInfo(data.info),
          scores: normalizeScores(data.scores),
          draftChanged: data.draftChanged === true,
        };
      },
    },
  ),
);
