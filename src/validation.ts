import type { EvaluationInfo, EvaluationInfoKey, EvaluationSection, ScoreKey, Scores } from './types';

export const REQUIRED_FIELDS: ReadonlyArray<{ key: EvaluationInfoKey; label: string; step: 0 | 2 }> = [
  { key: 'name', label: 'Nombre completo', step: 0 },
  { key: 'employee', label: 'N.º de funcionario', step: 0 },
  { key: 'date', label: 'Fecha de evaluación o entrega', step: 0 },
  { key: 'start', label: 'Inicio del período', step: 0 },
  { key: 'end', label: 'Fin del período', step: 0 },
  { key: 'concept', label: 'Observaciones', step: 2 },
  { key: 'evaluator', label: 'Aclaración del evaluador/a', step: 2 },
  { key: 'evaluated', label: 'Aclaración del evaluado/a', step: 2 },
];

export interface ValidationResult {
  valid: boolean;
  fieldErrors: Partial<Record<EvaluationInfoKey, string>>;
  scoreErrors: ScoreKey[];
  missingBySection: number[];
  totalRequired: number;
  completed: number;
  firstStep: 0 | 1 | 2;
  firstSection: number;
}

function realDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Validaciones compartidas por los dos formularios y los generadores de PDF. */
export function validateEvaluation(info: EvaluationInfo, scores: Scores, sections: EvaluationSection[]): ValidationResult {
  const fieldErrors: ValidationResult['fieldErrors'] = {};
  for (const field of REQUIRED_FIELDS) {
    if (!info[field.key].trim()) fieldErrors[field.key] = `${field.label} es obligatorio.`;
  }
  for (const key of ['date', 'start', 'end'] as const) {
    if (info[key].trim() && !realDate(info[key])) fieldErrors[key] = 'Ingresá una fecha válida.';
  }
  if (!fieldErrors.start && !fieldErrors.end && info.start > info.end) {
    fieldErrors.end = 'El fin del período no puede ser anterior al inicio.';
  }

  const scoreErrors: ScoreKey[] = [];
  const missingBySection = sections.map((section, i) => {
    let missing = 0;
    section.rows.forEach((name, j) => {
      const key: ScoreKey = `${i}-${j}`;
      const value = scores[key];
      const isDisciplinary = /^(Notas en legajo|Suspensiones)/.test(name);
      if (!value || !(['1', '2', '3', '4', '5'].includes(value)) || (isDisciplinary && value !== '1' && value !== '5')) {
        scoreErrors.push(key);
        missing++;
      }
    });
    return missing;
  });
  const firstSection = missingBySection.findIndex((count) => count > 0);
  const firstStep: 0 | 1 | 2 = REQUIRED_FIELDS.some((field) => field.step === 0 && fieldErrors[field.key]) ? 0
    : scoreErrors.length > 0 ? 1 : 2;
  const totalRequired = REQUIRED_FIELDS.length + sections.reduce((sum, section) => sum + section.rows.length, 0);
  const problems = Object.keys(fieldErrors).length + scoreErrors.length;
  return {
    valid: problems === 0, fieldErrors, scoreErrors, missingBySection,
    totalRequired, completed: totalRequired - problems,
    firstStep, firstSection: firstSection < 0 ? 0 : firstSection,
  };
}

export function validationMessage(result: ValidationResult): string {
  const fields = Object.keys(result.fieldErrors).length;
  const scores = result.scoreErrors.length;
  const parts: string[] = [];
  if (fields) parts.push(`${fields} ${fields === 1 ? 'campo pendiente o incorrecto' : 'campos pendientes o incorrectos'}`);
  if (scores) parts.push(`${scores} ${scores === 1 ? 'criterio sin puntuación válida' : 'criterios sin puntuación válida'}`);
  return parts.length ? `Completá la evaluación antes de continuar: ${parts.join(' y ')}.` : 'Evaluación completa.';
}
