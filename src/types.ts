/** Shared domain types for the evaluation form and its local persistence. */
export interface EvaluationInfo {
  name: string;
  employee: string;
  /** Local date in YYYY-MM-DD format (not UTC). */
  date: string;
  start: string;
  end: string;
  concept: string;
  evaluator: string;
  evaluated: string;
}

export type EvaluationInfoKey = keyof EvaluationInfo;
export type Score = '1' | '2' | '3' | '4' | '5';
/** Row keys are intentionally stable: `${sectionIndex}-${rowIndex}`. */
export type ScoreKey = `${number}-${number}`;
export type Scores = Partial<Record<ScoreKey, Score>>;

export interface SavedEvaluation {
  id: string;
  info: EvaluationInfo;
  scores: Scores;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationSection {
  title: string;
  page: number;
  edges: number[];
  average: readonly [number, number];
  rows: string[];
}

export type RubricLine = readonly [label: string, score: number];
export interface CriterionDetail {
  description?: string;
  rubricTitle?: string;
  rubric?: readonly RubricLine[];
}

export interface ScoreSummary {
  averages: (number | null)[];
  final: number | null;
}

export interface EvaluationStoreState {
  info: EvaluationInfo;
  scores: Scores;
  saved: SavedEvaluation[];
  activeId: string | null;
  draftChanged: boolean;
  updateField: (key: EvaluationInfoKey, value: string) => void;
  updateScore: (key: ScoreKey, value: Score | '') => void;
  newEvaluation: () => void;
  saveEvaluation: () => string;
  loadEvaluation: (id: string) => boolean;
  deleteEvaluation: (id: string) => void;
}

export type PersistedEvaluationState = Pick<
  EvaluationStoreState,
  'info' | 'scores' | 'saved' | 'activeId' | 'draftChanged'
>;
