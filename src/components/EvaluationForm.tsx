import { useMemo } from 'react';
import type { ChangeEvent } from 'react';
import type { CriterionDetail, EvaluationInfoKey, EvaluationSection, Score, ScoreKey, ScoreSummary } from '../types';
import { formatDate } from '../pdfTemplate';
import { useActiveEvaluationStore as useEvaluationStore, useCurrentForm, useFormValidation } from '../formContext';


const scoreOptions = [1, 2, 3, 4, 5];

export function useScoreSummary(): ScoreSummary {
  const scores = useEvaluationStore((state) => state.scores);
  const form=useCurrentForm();
  return useMemo(() => form.calculate(scores), [form, scores]);
}

export function GeneralInfo() {
  const form=useCurrentForm();
  const { result, attempted } = useFormValidation();
  const info = useEvaluationStore((state) => state.info);
  const updateField = useEvaluationStore((state) => state.updateField);
  const change = (key: EvaluationInfoKey) => (e: ChangeEvent<HTMLInputElement>) => updateField(key, e.target.value);
  const period = info.start && info.end
    ? `${formatDate(info.start)} al ${formatDate(info.end)}` : '';
  const fieldError = (key: EvaluationInfoKey) => attempted ? result.fieldErrors[key] : undefined;
  const inputAttrs = (key: EvaluationInfoKey) => ({
    id: `required-${key}`, required: true, 'aria-invalid': Boolean(fieldError(key)),
    'aria-describedby': fieldError(key) ? `error-${key}` : undefined,
  });
  const errorText = (key: EvaluationInfoKey) => fieldError(key) ? <small id={`error-${key}`} className="field-error">{fieldError(key)}</small> : null;
  return <section className="form-section">
    <h3>Datos del evaluado/a <span className="required-key">* Obligatorio</span></h3>
    <label>Nombre completo
      <input {...inputAttrs('name')} autoComplete="name" value={info.name} onChange={change('name')} placeholder="Nombre y apellido" />{errorText('name')}
    </label>
    <div className="fields-row">
      <label>N.º de funcionario<input {...inputAttrs('employee')} inputMode="numeric" value={info.employee} onChange={change('employee')} placeholder="Número" />{errorText('employee')}</label>
      <label>{form.dateLabel}<input {...inputAttrs('date')} type="date" value={info.date} onChange={change('date')} />{errorText('date')}</label>
    </div>
    <p className="hint">La fecha se completa con el día de hoy. Podés modificarla.</p>
    <div className="fields-row">
      <label>Inicio del período<input {...inputAttrs('start')} type="date" value={info.start} max={info.end || undefined} onChange={change('start')} />{errorText('start')}</label>
      <label>Fin del período<input {...inputAttrs('end')} type="date" value={info.end} min={info.start || undefined} onChange={change('end')} />{errorText('end')}</label>
    </div>
    <p className="hint">Período evaluado: <strong>{period || 'Seleccioná ambas fechas'}</strong></p>
  </section>;
}

/**
 * Los criterios y sus descripciones se muestran en una sola interfaz de escritorio.
 * The optional scoring rubric replicates the reference tables in the original PDF.
 * Score keys and calculations intentionally remain unchanged.
 */
function CriterionExplanation({ detail, id }: { detail: CriterionDetail; id: string }) {
  return <div className="criterion-explanation" id={id}>
    {detail.description && <p className="criterion-description">{detail.description}</p>}
    {detail.rubric && <div className="criterion-rubric">
      <div className="rubric-headers"><span>{detail.rubricTitle}</span><span>Calificación</span></div>
      {detail.rubric.map(([text, score]) => <div className="rubric-line" key={score}>
        <span>{text}</span><strong>{score}</strong>
      </div>)}
    </div>}
  </div>;
}

export function RatingSection({ section, index }: { section: EvaluationSection; index: number }) {
  const form = useCurrentForm();
  const { result, attempted } = useFormValidation();
  const scores = useEvaluationStore((state) => state.scores);
  const updateScore = useEvaluationStore((state) => state.updateScore);
  const { averages } = useScoreSummary();

  return <section className="form-section">
    <div className="section-head">
      <h3>{section.title}</h3>
      <span>Promedio: <strong>{averages[index] === null ? 'Pendiente' : averages[index].toFixed(2)}</strong></span>
    </div>
    {section.rows.map((name, j) => {
      const key: ScoreKey = `${index}-${j}`;
      const titleId = `criterion-title-${index}-${j}`;
      const descriptionId = `criterion-details-${index}-${j}`;
      const value = scores[key] || '';
      const invalid = attempted && result.scoreErrors.includes(key);
      const detail = form.details[index]?.[j] ?? { description: '' };
      // El documento original permite solo 1 o 5 en notas y suspensiones.
      const options = /^(Notas en legajo|Suspensiones)/.test(name) ? [1, 5] : scoreOptions;
      return <div className={`score-row ${invalid ? 'score-invalid' : ''}`} key={key} id={`required-score-${key}`}>
        <div className="score-details">
          <strong id={titleId} className="criterion-title">{name}</strong>
          <CriterionExplanation detail={detail} id={descriptionId} />
        </div>
        <select
          required
          aria-invalid={invalid}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          value={value}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => updateScore(key, event.target.value as Score | '')}
        >
          <option value="">Sin puntuar</option>
          {options.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>;
    })}
  </section>;
}

export function AllDesktopRatings() {
  const form=useCurrentForm();
  return form.sections.map((section, index) =>
    <RatingSection key={section.title} section={section} index={index} />);
}

export function ConceptFields() {
  const info = useEvaluationStore((state) => state.info);
  const updateField = useEvaluationStore((state) => state.updateField);
  const { result, attempted } = useFormValidation();
  const errorText = (key: 'concept' | 'evaluator' | 'evaluated') => attempted && result.fieldErrors[key]
    ? <small id={`error-${key}`} className="field-error">{result.fieldErrors[key]}</small> : null;
  const invalid = (key: 'concept' | 'evaluator' | 'evaluated') => attempted && !!result.fieldErrors[key];
  return <section className="form-section">
    <h3>Concepto del evaluador/a <span className="required-key">* Obligatorio</span></h3>
    <label>Observaciones
      <textarea id="required-concept" required aria-invalid={invalid('concept')} aria-describedby={invalid('concept') ? 'error-concept' : undefined} rows={5} value={info.concept} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => updateField('concept', e.target.value)}
        placeholder="Escribí la evaluación y observaciones..." />{errorText('concept')}
    </label>
    <div className="fields-row">
      <label>Aclaración del evaluador/a
        <input id="required-evaluator" required aria-invalid={invalid('evaluator')} aria-describedby={invalid('evaluator') ? 'error-evaluator' : undefined} value={info.evaluator} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('evaluator', e.target.value)} />{errorText('evaluator')}
      </label>
      <label>Aclaración del evaluado/a
        <input id="required-evaluated" required aria-invalid={invalid('evaluated')} aria-describedby={invalid('evaluated') ? 'error-evaluated' : undefined} value={info.evaluated} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('evaluated', e.target.value)} />{errorText('evaluated')}
      </label>
    </div>
    <p className="hint">Las firmas permanecen en blanco para completarlas después de imprimir.</p>
  </section>;
}

export function FinalScore() {
  const { final } = useScoreSummary();
  return <div className="result"><span>PUNTAJE FINAL</span><strong>{final === null ? 'Pendiente' : `${final.toFixed(2)} / 5`}</strong></div>;
}
