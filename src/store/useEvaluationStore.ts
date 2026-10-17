import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  EvaluationInfo,
  EvaluationStoreState,
  PersistedEvaluationState,
  SavedEvaluation,
  Scores,
} from '../types';

const pad = (value: number): string => String(value).padStart(2, '0');

/** Date in the user's local timezone, preventing UTC day shifts. */
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

/** Supports existing localStorage values created by the JavaScript version. */
function normalizeInfo(value: unknown): EvaluationInfo {
  const fallback = emptyInfo();
  if (!isObject(value)) return fallback;
  for (const key of Object.keys(fallback) as (keyof EvaluationInfo)[]) {
    if (typeof value[key] === 'string') fallback[key] = value[key];
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

function normalizeSaved(value: unknown): SavedEvaluation[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: unknown): SavedEvaluation[] => {
    if (!isObject(item) || typeof item.id !== 'string' || !isObject(item.info)) return [];
    return [{
      id: item.id,
      info: normalizeInfo(item.info),
      scores: normalizeScores(item.scores),
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
      updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : '',
    }];
  });
}

/** Zustand persist keeps the draft and history *only in this browser*. */
export const useEvaluationStore = create<EvaluationStoreState>()(
  persist<EvaluationStoreState, [], [], PersistedEvaluationState>(
    (set, get) => ({
      info: emptyInfo(),
      scores: {},
      saved: [],
      activeId: null,
      draftChanged: false,

      updateField: (key, value) => set((state) => ({
        info: { ...state.info, [key]: value }, draftChanged: true,
      })),
      updateScore: (key, value) => set((state) => {
        const scores: Scores = { ...state.scores };
        if (!value) delete scores[key];
        else scores[key] = value;
        return { scores, draftChanged: true };
      }),
      newEvaluation: () => set({
        info: emptyInfo(), scores: {}, activeId: null, draftChanged: false,
      }),
      saveEvaluation: () => {
        const state = get();
        const now = new Date().toISOString();
        const id = state.activeId || (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID() : `eval-${Date.now()}-${Math.random().toString(36).slice(2)}`);
        const previous = state.saved.find((item) => item.id === id);
        const item: SavedEvaluation = {
          id,
          info: { ...state.info },
          scores: { ...state.scores },
          createdAt: previous?.createdAt || now,
          updatedAt: now,
        };
        set({
          saved: [item, ...state.saved.filter((other) => other.id !== id)],
          activeId: id,
          draftChanged: false,
        });
        return id;
      },
      loadEvaluation: (id) => {
        const item = get().saved.find((entry) => entry.id === id);
        if (!item) return false;
        set({
          info: { ...item.info },
          scores: { ...item.scores },
          activeId: item.id,
          draftChanged: false,
        });
        return true;
      },
      deleteEvaluation: (id) => set((state) => ({
        saved: state.saved.filter((item) => item.id !== id),
        activeId: state.activeId === id ? null : state.activeId,
      })),
    }),
    {
      // Do not rename: the user's previously saved evaluations use this key.
      name: 'camcel-evaluaciones-v1',
      storage: createJSONStorage<PersistedEvaluationState>(() => localStorage),
      version: 1,
      partialize: (state): PersistedEvaluationState => ({
        info: state.info,
        scores: state.scores,
        saved: state.saved,
        activeId: state.activeId,
        draftChanged: state.draftChanged,
      }),
      merge: (stored: unknown, current): EvaluationStoreState => {
        const data = isObject(stored) ? stored : {};
        const saved = normalizeSaved(data.saved);
        const activeId = typeof data.activeId === 'string' ? data.activeId : null;
        return {
          ...current,
          info: normalizeInfo(data.info),
          scores: normalizeScores(data.scores),
          saved,
          activeId: activeId && saved.some((item) => item.id === activeId) ? activeId : null,
          draftChanged: data.draftChanged === true,
        };
      },
    },
  ),
);
