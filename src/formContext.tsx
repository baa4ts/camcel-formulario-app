import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useEvaluationStore } from './store/useEvaluationStore';
import { useLicensedEvaluationStore } from './store/useLicensedEvaluationStore';
import type { EvaluationStoreState, EvaluationSection, CriterionDetail, ScoreSummary, Scores } from './types';
import { validateEvaluation } from './validation';
import type { ValidationResult } from './validation';
import { SECTIONS, calculateAverages, completeOriginalPdf } from './pdfTemplate';
import { CRITERIA_DETAILS } from './criteriaDescriptions';
import { LICENSED_SECTIONS, calculateLicensedAverages, completeLicensedPdf } from './pdfTemplateLicensed';
import { LICENSED_DETAILS } from './criteriaLicensed';
import plantillaAux from './assets/plantilla-original.pdf?url';
import plantillaLic from './assets/plantilla-licenciado.pdf?url';

export type FormId = 'fo-en-01' | 'fo-en-02';
export interface FormConfiguration {
  id:FormId;
  code:string;
  name:string;
  shortName:string;
  dateLabel:string;
  pages:number;
  sections:EvaluationSection[];
  details:CriterionDetail[][];
  templateUrl:string;
  calculate:(scores:Scores)=>ScoreSummary;
  generate:typeof completeOriginalPdf;
}
export const FORMS:Record<FormId,FormConfiguration> = {
  'fo-en-01':{id:'fo-en-01',code:'FO-EN-01',name:'Auxiliar de Enfermería',shortName:'Auxiliar',dateLabel:'Fecha de evaluación',pages:3,
    sections:SECTIONS,details:CRITERIA_DETAILS,templateUrl:plantillaAux,calculate:calculateAverages,generate:completeOriginalPdf},
  'fo-en-02':{id:'fo-en-02',code:'FO-EN-02',name:'Licenciado/a en Enfermería',shortName:'Licenciado/a',dateLabel:'Fecha de entrega',pages:4,
    sections:LICENSED_SECTIONS,details:LICENSED_DETAILS,templateUrl:plantillaLic,calculate:calculateLicensedAverages,generate:completeLicensedPdf},
};
const FormContext=createContext<FormId>('fo-en-01');
interface ValidationContextValue {
  result: ValidationResult;
  attempted: boolean;
  requireComplete: () => boolean;
  requireStep: (step: 0 | 1 | 2) => boolean;
  resetValidation: () => void;
}
const ValidationContext = createContext<ValidationContextValue | null>(null);

export function FormProvider({id,children}:{id:FormId;children:ReactNode}){
  const [attempted, setAttempted] = useState(false);
  const auxiliaryInfo = useEvaluationStore(s => s.info);
  const auxiliaryScores = useEvaluationStore(s => s.scores);
  const licensedInfo = useLicensedEvaluationStore(s => s.info);
  const licensedScores = useLicensedEvaluationStore(s => s.scores);
  const info = id === 'fo-en-02' ? licensedInfo : auxiliaryInfo;
  const scores = id === 'fo-en-02' ? licensedScores : auxiliaryScores;
  const sections = FORMS[id].sections;
  const result = useMemo(() => validateEvaluation(info, scores, sections), [info, scores, sections]);

  function announceInvalid(step: 0 | 1 | 2, section: number): void {
    window.dispatchEvent(new CustomEvent('camcel:invalid', { detail: { formId: id, step, section } }));
  }
  function requireComplete(): boolean {
    setAttempted(true);
    if (!result.valid) announceInvalid(result.firstStep, result.firstSection);
    return result.valid;
  }
  function requireStep(step: 0 | 1 | 2): boolean {
    setAttempted(true);
    const valid = step === 0 ? !(['name','employee','date','start','end'] as const).some(key => result.fieldErrors[key])
      : step === 1 ? result.scoreErrors.length === 0
      : !(['concept','evaluator','evaluated'] as const).some(key => result.fieldErrors[key]);
    if (!valid) announceInvalid(step, result.firstSection);
    return valid;
  }
  return <FormContext.Provider value={id}>
    <ValidationContext.Provider value={{ result, attempted, requireComplete, requireStep, resetValidation: () => setAttempted(false) }}>
      {children}
    </ValidationContext.Provider>
  </FormContext.Provider>;
}

export function useFormValidation(): ValidationContextValue {
  const value = useContext(ValidationContext);
  if (!value) throw new Error('El formulario debe estar dentro de FormProvider.');
  return value;
}

export const useCurrentFormId=()=>useContext(FormContext);
export function useCurrentForm():FormConfiguration{return FORMS[useCurrentFormId()];}
/** Both hooks are called consistently; only the active form's state is returned. */
export function useActiveEvaluationStore<T>(selector:(state:EvaluationStoreState)=>T):T {
  const id=useCurrentFormId();
  const auxiliary=useEvaluationStore(selector);
  const licensed=useLicensedEvaluationStore(selector);
  return id==='fo-en-02'?licensed:auxiliary;
}
