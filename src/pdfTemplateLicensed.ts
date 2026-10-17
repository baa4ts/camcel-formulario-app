import { validateEvaluation, validationMessage } from './validation';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import plantillaPdfUrl from './assets/plantilla-licenciado.pdf?url';
import type { EvaluationInfo, Scores, EvaluationSection, ScoreSummary } from './types';
import { formatDate } from './pdfTemplate';

/** FO-EN-02, edición 1. Límites reales de las celdas en puntos PDF (origen superior). */
export const LICENSED_SECTIONS: EvaluationSection[] = [
  { title:'I. PROCESO DE ATENCIÓN DE ENFERMERÍA', page:0, edges:[236,254,280,298,324], average:[324,342], rows:[
    'Pase de guardia – Recepción','Pase de guardia – Entrega','Valoración del paciente','Registro en HCE'] },
  { title:'II. ORGANIZACIÓN Y SUPERVISIÓN DEL TRABAJO', page:0, edges:[386,412,430,448], average:[448,466], rows:[
    'División del trabajo','Supervisión','Cumplimiento'] },
  { title:'III. ATENCIÓN DIRECTA Y SEGURIDAD DEL PACIENTE', page:0, edges:[510,528,546,564,590], average:[590,608], rows:[
    'Constantes vitales','Procedimientos','Emergencias','Traslados'] },
  { title:'IV. COORDINACIÓN Y COMUNICACIÓN', page:0, edges:[652,670,688,714], average:[714,732], rows:[
    'Visita médica','Coordinación','Información'] },
  { title:'V. GESTIÓN DE RECURSOS MATERIALES Y EQUIPOS', page:1, edges:[130,148,166,184], average:[184,202], rows:[
    'Equipos','Materiales','Mantenimiento'] },
  { title:'VI. PROTOCOLOS INSTITUCIONALES', page:1, edges:[246,264,282,308], average:[308,326], rows:[
    'Conocimiento','Adherencia','Supervisión'] },
  { title:'VII. ORIENTACIÓN AL USUARIO Y PLAN DE ALTA', page:1, edges:[370,396,414,432], average:[432,450], rows:[
    'Orientación','Educación','Plan de alta'] },
  { title:'VIII. DOCENCIA Y DESARROLLO PROFESIONAL', page:1, edges:[494,512,530,614,632], average:[632,650], rows:[
    'Orientación','Educación incidental','Formación','Investigación'] },
  { title:'IX. APARIENCIA PERSONAL', page:2, edges:[130,148,166,184,202,220], average:[220,238], rows:[
    'Cabello','Uñas','Alhajas','Uniforme','Zapatos'] },
  { title:'X. CONDUCTA PROFESIONAL Y ANTECEDENTES DISCIPLINARIOS', page:2, edges:[282,300,326,352,370,396,422,448], average:[448,466], rows:[
    'Normas','Trato','Discreción','Empatía','Compromiso','Notas en legajo (últimos 2 años)','Suspensiones (últimos 2 años)'] },
];

export function calculateLicensedAverages(scores: Scores): ScoreSummary {
  const averages = LICENSED_SECTIONS.map((section,i) => {
    const values = section.rows.map((_,j) => Number(scores[`${i}-${j}`]));
    return values.every(v => Number.isInteger(v) && v>=1 && v<=5)
      ? values.reduce((a,b)=>a+b,0)/values.length : null;
  });
  const complete = averages.filter((value):value is number=>value!==null);
  return { averages, final: complete.length===averages.length ? complete.reduce((a,b)=>a+b,0)/complete.length : null };
}

type Rect = readonly [number,number,number,number];
export async function completeLicensedPdf(info:EvaluationInfo,scores:Scores): Promise<Blob> {
  const validation = validateEvaluation(info, scores, LICENSED_SECTIONS);
  if (!validation.valid) throw new Error(validationMessage(validation));

  if (info.start && info.end && info.end < info.start) throw new Error('La fecha final es anterior al inicio del período.');
  const response = await fetch(plantillaPdfUrl);
  if (!response.ok) throw new Error(`No se encontró la plantilla FO-EN-02 (HTTP ${response.status}).`);
  const bytes = await response.arrayBuffer();
  if (new TextDecoder('ascii').decode(bytes.slice(0,5)) !== '%PDF-') throw new Error('La plantilla FO-EN-02 no es un PDF válido.');
  const doc=await PDFDocument.load(bytes);
  if (doc.getPageCount()!==4) throw new Error('FO-EN-02 debe tener cuatro páginas.');
  const pages=doc.getPages(), normal=await doc.embedFont(StandardFonts.Helvetica), bold=await doc.embedFont(StandardFonts.HelveticaBold);
  const ink=rgb(0.075,0.12,0.17);
  function place(value: string | number | undefined | null, pageIndex:number, rect:Rect, opts:{size?:number;align?:'left'|'center';bold?:boolean}={}):void {
    const text=String(value??'').trim(); if (!text) return;
    const [x0,y0,x1,y1]=rect, font=opts.bold?bold:normal;
    let size=opts.size??8; const max=x1-x0-10;
    while (size>6 && font.widthOfTextAtSize(text,size)>max) size-=0.25;
    if (font.widthOfTextAtSize(text,size)>max) throw new Error(`El texto «${text.slice(0,26)}» no cabe en su casilla.`);
    const width=font.widthOfTextAtSize(text,size);
    const x=opts.align==='center'?(x0+x1-width)/2:x0+5;
    const baselineTop=(y0+y1)/2+(1.075-.299)*size/2;
    pages[pageIndex].drawText(text,{x,y:pages[pageIndex].getHeight()-baselineTop,font,size,color:ink});
  }
  place(info.name,0,[140.7,114,559.28,132],{size:8.5});
  place(info.employee,0,[140.7,132,350,150],{size:8.5});
  place(formatDate(info.date),0,[444.16,132,559.28,150],{size:8.5});
  const period=info.start&&info.end?`${formatDate(info.start)} al ${formatDate(info.end)}`:'';
  place(period,0,[140.7,150,559.28,168],{size:8.5});
  const {averages,final}=calculateLicensedAverages(scores);
  // Cinco columnas del formulario. Una X en la columna elegida, NO números sobre la plantilla.
  const scoreStart=449.28,scoreWidth=22;
  LICENSED_SECTIONS.forEach((section,i)=>{
    section.rows.forEach((_,j)=>{
      const score=Number(scores[`${i}-${j}`]);
      if (!Number.isInteger(score)||score<1||score>5) return;
      const x0=scoreStart+(score-1)*scoreWidth;
      place('X',section.page,[x0,section.edges[j],x0+scoreWidth,section.edges[j+1]],{size:10,align:'center',bold:true});
    });
    if(averages[i]!==null)place(averages[i].toFixed(2),section.page,[449.28,section.average[0],559.28,section.average[1]],{size:9,align:'center',bold:true});
  });
  // Página cuatro: diez filas de 18pt, luego la fila de puntaje final.
  averages.forEach((a,i)=>{if(a!==null)place(a.toFixed(2),3,[402.29,130+i*18,559.28,148+i*18],{size:9,align:'center'});});
  if(final!==null)place(final.toFixed(2),3,[402.29,310,559.28,328],{size:10,align:'center',bold:true});
  // Concepto: cinco renglones impresos, sin cruzar las líneas.
  const comments:string[]=[];
  for(const paragraph of (info.concept||'').replace(/\r/g,'').split('\n')){
    if(!paragraph.trim()){comments.push('');continue;}
    let current='';
    for(const word of paragraph.trim().split(/\s+/)){
      const trial=current?`${current} ${word}`:word;
      if(normal.widthOfTextAtSize(trial,8)>511 && current){comments.push(current);current=word;}else current=trial;
    }
    if(current) comments.push(current);
  }
  if(comments.length>5)throw new Error('Las observaciones superan los cinco renglones disponibles en el PDF.');
  comments.forEach((text,i)=>place(text,3,[36,372+i*18,559.28,390+i*18],{size:8}));
  // Aclaraciones arriba de la etiqueta, firmas sin alterar.
  place(info.evaluator,3,[36,519,297.64,539],{size:8,align:'center'});
  place(info.evaluated,3,[297.64,519,559.28,539],{size:8,align:'center'});
  const output=await doc.save();const arrayBuffer=new ArrayBuffer(output.byteLength);new Uint8Array(arrayBuffer).set(output);
  return new Blob([arrayBuffer],{type:'application/pdf'});
}
