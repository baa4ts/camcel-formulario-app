import type { CriterionDetail } from './types';

/** FO-EN-02, versión 1. Descripciones transcritas en el mismo orden del PDF. */
export const LICENSED_DETAILS: CriterionDetail[][] = [
  [
    {description:'Recibe la guardia en hora y correctamente uniformado.'},
    {description:'Entrega la guardia en hora, con registros completos e incluyendo la ocurrencia de eventos adversos.'},
    {description:'Realiza valoración integral del paciente.'},
    {description:'Registra valoración de enfermería, procedimientos y coordinaciones en la Historia Clínica Electrónica.'},
  ],
  [
    {description:'Organiza tareas según nivel de dependencia de Usuarios y recursos disponibles.'},
    {description:'Asigna y supervisa tareas del personal.'},
    {description:'Verifica cumplimiento de actividades del turno.'},
  ],
  [
    {description:'Valora constantes vitales y condiciones clínicas.'},
    {description:'Realiza o supervisa procedimientos invasivos y curaciones.'},
    {description:'Resuelve emergencias en coordinación con médico de guardia.'},
    {description:'Asegura traslados en condiciones óptimas, incluyendo aspectos vinculados a la seguridad del paciente.'},
  ],
  [
    {description:'Participa aportando información relevante.'},
    {description:'Realiza coordinaciones con otros servicios en tiempo y forma.'},
    {description:'Informa oportunamente a la Supervisora sobre Usuarios críticos y situaciones relevantes.'},
  ],
  [
    {description:'Revisa unidades y equipos, comprobando funcionamiento.'},
    {description:'Solicita materiales y controla vencimientos.'},
    {description:'Coordina reparaciones con Mantenimiento.'},
  ],
  [
    {description:'Conoce los protocolos institucionales vigentes.'},
    {description:'Se adhiere a los protocolos en su práctica diaria.'},
    {description:'Promueve, supervisa y evalúa la adherencia del personal de enfermería a los protocolos.'},
  ],
  [
    {description:'Orienta al Usuario y acompañante en el servicio, incluyendo aspectos vinculados a la seguridad del paciente.'},
    {description:'Aplica educación continua durante la internación.'},
    {description:'Implementa y supervisa el plan de alta hasta el egreso.'},
  ],
  [
    {description:'Orienta y evalúa nuevo personal.'},
    {description:'Realiza educación incidental al personal.'},
    {description:'Cumplimiento de capacitaciones:',rubricTitle:'Porcentaje de cumplimiento',rubric:[
      ['No realizó capacitaciones',1],['Hasta el 25 %',2],['Entre el 26 % y el 50 %',3],['Entre el 51 % y el 75 %',4],['Entre el 76 % y el 100 %',5],
    ]},
    {description:'Colabora en investigaciones.'},
  ],
  [
    {description:'Recogido, prolijo y acorde al rol.'},
    {description:'Cortas, limpias, sin esmaltado o con esmaltado claro e íntegro.'},
    {description:'Uso discreto y seguro.'},
    {description:'Completo, limpio y en buen estado.'},
    {description:'Reglamentarios, limpios y en buen estado.'},
  ],
  [
    {description:'Respeta normas institucionales.'},
    {description:'Mantiene trato cordial con autoridades, funcionarios, Usuarios y acompañantes.'},
    {description:'Mantiene discreción en el manejo de información sensible y en la comunicación.'},
    {description:'Demuestra empatía hacia Usuarios, acompañantes y equipo de trabajo.'},
    {description:'Evidencia compromiso con sus responsabilidades, el equipo y los objetivos institucionales.'},
    {description:'No tiene = 5 · Tiene = 1'},
    {description:'No tiene = 5 · Tiene = 1'},
  ],
];
