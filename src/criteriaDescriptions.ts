import type { CriterionDetail } from './types';

/**
 * Descripciones transcritas del formulario FO-EN-01, versión 1 (3 páginas).
 * El orden corresponde exactamente a SECTIONS y a sus filas en pdfTemplate.ts.
 * No alteres ese orden sin modificar también las coordenadas del PDF.
 */
export const CRITERIA_DETAILS: CriterionDetail[][] = [
  [
    { description: 'Recibe pase de guardia en hora, correctamente uniformado.' },
    { description: 'Mantiene higiene y confort del Usuario y su unidad.' },
    { description: 'Ejecuta atención de enfermería según protocolos.' },
    { description: 'Controla y comunica alteraciones oportunamente.' },
    { description: 'Prepara y administra medicación según indicación médica y protocolos de la institución.' },
    { description: 'Prepara para estudios, intervenciones y traslados, aplicando protocolos de seguridad del paciente.' },
    { description: 'Registra ingresos, altas y procedimientos.' },
    { description: 'Realiza registros de enfermería de valoración del Usuario en historia clínica.' },
    { description: 'Brinda orientación y educación sobre cuidados, procedimientos y pautas de alta, incluyendo aspectos vinculados a la seguridad del paciente.' },
    { description: 'Apoya y guía a colegas en período de orientación dentro del servicio.' },
  ],
  [
    { description: 'Mantiene salas ordenadas y prontas.' },
    { description: 'Cumple tareas en tiempo y forma.' },
    { description: 'Desarrolla procedimientos con privacidad.' },
    { description: 'Mantiene asepsia en los procedimientos realizados.' },
    { description: 'Informa faltas o averías oportunamente.' },
    { description: 'Utiliza responsablemente el material de uso y mantiene en buen estado las instalaciones del servicio.' },
    { description: 'Realiza y registra correctamente los descansos intermedios durante la jornada.' },
    { description: 'Mantiene orden y limpieza.' },
  ],
  [
    { description: 'Orienta a Usuario y acompañante en el servicio.' },
    { description: 'Mantiene trato respetuoso con superiores, funcionarios y Usuarios.' },
    { description: 'Mantiene confidencialidad y reserva en la información del Usuario y del servicio.' },
  ],
  [
    { description: 'Cumple con la normativa institucional.' },
    { description: 'Se mantiene informado sobre novedades del servicio y actúa en consecuencia.' },
    { description: 'Conoce y demuestra adherencia a protocolos institucionales.' },
    {
      rubricTitle: 'Porcentaje de cumplimiento',
      rubric: [
        ['No realizó capacitaciones', 1],
        ['Hasta el 25 %', 2],
        ['Entre el 26 % y el 50 %', 3],
        ['Entre el 51 % y el 75 %', 4],
        ['Entre el 76 % y el 100 %', 5],
      ],
    },
    { description: 'No tiene = 5 · Tiene = 1' },
    { description: 'No tiene = 5 · Tiene = 1' },
    {
      rubricTitle: 'Resultado',
      rubric: [
        ['Insuficiente (0–39 %)', 1],
        ['Regular (40–59 %)', 2],
        ['Bueno (60–74 %)', 3],
        ['Muy bueno (75–89 %)', 4],
        ['Excelente (90–100 %)', 5],
      ],
    },
    { description: 'Demuestra iniciativa para colaborar activamente en el servicio y con el equipo de trabajo, manteniendo buena disposición ante los cambios solicitados por la institución.' },
  ],
  [
    { description: 'Recogido y prolijo.' },
    { description: 'Cortas, sin esmalte o con esmaltado claro e íntegro. Sin esmaltado permanente y sin uñas artificiales.' },
    { description: 'Completo y en buen estado (pantalón, casaca, campera, zuecos).' },
    { description: 'Presencia de alhajas (autorizado solamente alianza matrimonial y anillo profesional).' },
  ],
];

export function getCriterionDetail(sectionIndex: number, rowIndex: number): CriterionDetail {
  return CRITERIA_DETAILS[sectionIndex]?.[rowIndex] || { description: '' };
}
