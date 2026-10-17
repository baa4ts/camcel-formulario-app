import { validateEvaluation, validationMessage } from './validation';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import plantillaPdfUrl from './assets/plantilla-original.pdf?url';
import type { EvaluationInfo, Scores, EvaluationSection, ScoreSummary } from './types';

type Rect = readonly [left: number, top: number, right: number, bottom: number];
type TextAlign = 'left' | 'center' | 'right';
interface PlaceOptions { size?: number; minSize?: number; align?: TextAlign; isBold?: boolean; }

// Exact cell boundaries measured on the original 595.28 × 841.89 pt PDF.
// All rectangles use PDF coordinates from the TOP-LEFT corner.
export const SECTIONS: EvaluationSection[] = [
  {
    title: 'I. RESPONSABILIDADES OPERATIVAS', page: 0,
    edges: [236,254,272,290,308,334,360,378,396,422,448],
    average: [448,466],
    rows: ['Pase de guardia','Higiene y confort','Atención integral','Constantes vitales',
      'Medicación','Preparación del Usuario','Registros generales','Registros de valoración',
      'Educación al paciente y acompañante','Colaboración en orientación de pares'],
  },
  {
    title: 'II. ORGANIZACIÓN Y CUMPLIMIENTO', page: 0,
    edges: [510,528,546,564,582,600,626,644,662], average: [662,680],
    rows: ['Salas','Tareas asignadas','Técnicas','Asepsia','Materiales / equipos',
      'Cuidado de materiales e instalaciones','Descansos intermedios','Área de enfermería'],
  },
  {
    title: 'III. COMUNICACIÓN Y TRATO', page: 1,
    edges: [130,148,166,184], average: [184,202],
    rows: ['Orientación','Respeto y cordialidad','Discreción'],
  },
  {
    title: 'IV. COMPROMISO ÉTICO Y NORMATIVO', page: 1,
    edges: [246,264,282,300,372,398,424,496,532], average: [532,550],
    rows: ['Normativas','Actualización','Protocolos','Capacitaciones',
      'Notas en legajo (últimos 2 años)','Suspensiones (últimos 2 años)',
      'Prueba escrita','Iniciativa'],
  },
  {
    title: 'V. APARIENCIA PERSONAL', page: 1,
    edges: [594,612,648,666,692], average: [692,710],
    rows: ['Cabello','Uñas','Uniforme','Alhajas'],
  },
];

export const SCORE_BOX = { left: 480.78, right: 559.28 };
export const AVG_BOX = { left: 402.28, right: 559.28 };
export const TEXT_BOXES: Record<'name' | 'employee' | 'evaluationDate' | 'period' | 'evaluator' | 'evaluated', Rect> = {
  name: [140.70,114,559.28,132],
  employee: [140.70,132,350,150],
  evaluationDate: [444.16,132,559.28,150],
  period: [140.70,150,559.28,168],
  // These rectangles are the EMPTY line above the printed "Aclaración" labels.
  evaluator: [36,411,297.64,430],
  evaluated: [297.64,411,559.28,430],
};

export const formatDate = (value: string): string => {
  if (!value) return '';
  const [y,m,d] = value.split('-');
  return `${d}/${m}/${y}`;
};

export function calculateAverages(scores: Scores): ScoreSummary {
  const averages = SECTIONS.map((s, i) => {
    const values = s.rows.map((_, j) => Number(scores[`${i}-${j}`]));
    return values.every(v => Number.isInteger(v) && v >= 1 && v <= 5)
      ? values.reduce((a,b) => a+b, 0) / values.length : null;
  });
  const complete = averages.filter((value): value is number => value !== null);
  const final = complete.length === averages.length
    ? complete.reduce((a,b) => a+b, 0) / complete.length : null;
  return { averages, final };
}

export async function completeOriginalPdf(info: EvaluationInfo, scores: Scores): Promise<Blob> {
  const validation = validateEvaluation(info, scores, SECTIONS);
  if (!validation.valid) throw new Error(validationMessage(validation));

  if (info.start && info.end && info.end < info.start) {
    throw new Error('La fecha final del período no puede ser anterior a la inicial.');
  }
  const response = await fetch(plantillaPdfUrl);
  if (!response.ok) throw new Error(`No se pudo abrir el PDF original (HTTP ${response.status}).`);
  const pdfBytes = await response.arrayBuffer();
  if (new TextDecoder('ascii').decode(pdfBytes.slice(0, 5)) !== '%PDF-') {
    throw new Error('El archivo de plantilla no contiene un PDF válido. Revisá src/assets/plantilla-original.pdf.');
  }

  const doc = await PDFDocument.load(pdfBytes);
  if (doc.getPageCount() !== 3) throw new Error('La plantilla debe tener exactamente tres páginas.');
  const pages = doc.getPages();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const color = rgb(0.075,0.12,0.17);

  // Text is laid out ONLY within measured empty cells. No transformations/skew.
  function place(text: string | number | null | undefined, pageNumber: number, rect: Rect, { size = 8, minSize = 6.5, align = 'left', isBold = false }: PlaceOptions = {}): void {
    const value = String(text ?? '').trim();
    if (!value) return;
    const [left, top, right, bottom] = rect;
    const f = isBold ? bold : regular;
    const width = right - left - 10;
    const height = bottom - top;
    let pointSize = size;
    // Resize within the cell, never overflow into the labels or grid.
    while (f.widthOfTextAtSize(value, pointSize) > width && pointSize > minSize) {
      pointSize = Math.max(minSize, pointSize - 0.25);
    }
    if (f.widthOfTextAtSize(value, pointSize) > width) {
      throw new Error(`El texto «${value.slice(0,30)}» es demasiado largo para su casilla.`);
    }
    const textWidth = f.widthOfTextAtSize(value, pointSize);
    const x = align === 'center'
      ? (left + right - textWidth) / 2
      : align === 'right' ? right - 5 - textWidth : left + 5;
    // Helvetica ascender 1.075 / descender -0.299. This centers the ink bbox.
    const baselineTop = (top + bottom) / 2 + (1.075 - 0.299) * pointSize / 2;
    const y = pages[pageNumber].getHeight() - baselineTop;
    if (height < pointSize * 1.28) throw new Error('La celda no tiene espacio suficiente para el texto.');
    try {
      pages[pageNumber].drawText(value, {
        x, y, size: pointSize, font: f, color, rotate: degrees(0),
      });
    } catch (e) {
      throw new Error(`No se puede escribir «${value.slice(0,30)}». Usá caracteres de texto habituales (sin emojis). ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // 1st page: each datum is placed in its OWN original blank rectangle.
  place(info.name, 0, TEXT_BOXES.name, { size: 8.5, minSize: 7.0 });
  place(info.employee, 0, TEXT_BOXES.employee, { size: 8.5 });
  place(formatDate(info.date), 0, TEXT_BOXES.evaluationDate, { size: 8.5 });
  const period = info.start && info.end ? `${formatDate(info.start)} al ${formatDate(info.end)}` : '';
  place(period, 0, TEXT_BOXES.period, { size: 8.5 });

  const { averages, final } = calculateAverages(scores);
  SECTIONS.forEach((section, i) => {
    section.rows.forEach((_, j) => {
      place(scores[`${i}-${j}`], section.page,
        [SCORE_BOX.left,section.edges[j],SCORE_BOX.right,section.edges[j+1]],
        { size: 9, align: 'center', isBold: true });
    });
    if (averages[i] !== null) {
      place(averages[i].toFixed(2), section.page,
        [SCORE_BOX.left, section.average[0], SCORE_BOX.right, section.average[1]],
        { size: 9, align: 'center', isBold: true });
    }
  });

  // 3rd page: the score summary consists of 5 exact 18-pt rows.
  averages.forEach((avg,i) => {
    if (avg !== null) place(avg.toFixed(2), 2,
      [AVG_BOX.left,130+i*18,AVG_BOX.right,148+i*18],
      { size: 9, align: 'center' });
  });
  if (final !== null) place(final.toFixed(2),2,
    [AVG_BOX.left,220,AVG_BOX.right,238],
    { size: 10, align: 'center', isBold: true });

  // Comments: exactly 5 blank writing lines (each 18 pt tall), no text on the lines.
  const commentsWidth = 559.28 - 36 - 12;
  const commentSize = 8;
  const commentLines = [];
  for (const paragraph of String(info.concept ?? '').replace(/\r/g,'').split('\n')) {
    if (!paragraph.trim()) { commentLines.push(''); continue; }
    let line = '';
    for (const word of paragraph.trim().split(/\s+/)) {
      const trial = line ? `${line} ${word}` : word;
      if (regular.widthOfTextAtSize(trial,commentSize) > commentsWidth && line) {
        commentLines.push(line);
        line = word;
      } else line = trial;
    }
    if (line) commentLines.push(line);
  }
  if (commentLines.length > 5) {
    throw new Error('El concepto del evaluador ocupa más de cinco líneas del PDF. Resumilo para evitar texto superpuesto.');
  }
  commentLines.forEach((line, index) => {
    place(line, 2, [36,264+index*18,559.28,282+index*18],
      { size: commentSize, minSize: commentSize });
  });

  // Aclaraciones stay above their printed labels, signature spaces remain blank.
  place(info.evaluator, 2, TEXT_BOXES.evaluator,
    { size: 8, minSize: 6.5, align: 'center' });
  place(info.evaluated, 2, TEXT_BOXES.evaluated,
    { size: 8, minSize: 6.5, align: 'center' });

  const bytes = await doc.save();
  // ArrayBuffer ensures BlobPart compatibility with strict DOM typings.
  const output = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(output).set(bytes);
  return new Blob([output], { type: 'application/pdf' });
}
