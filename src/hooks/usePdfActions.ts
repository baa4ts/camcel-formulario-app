// src/hooks/usePdfActions.ts
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { isTauri } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { useActiveEvaluationStore as useEvaluationStore, useCurrentForm, useCurrentFormId, useFormValidation } from '../formContext';
import { verifySaved } from '../utils/verifySaved';

function nombreParaArchivo(value: string): string {
  const partes = (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return partes
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join('')
    .slice(0, 80) || 'Funcionario';
}

export default function usePdfActions() {
  const navigate = useNavigate();
  const form = useCurrentForm();
  const formId = useCurrentFormId();
  const { requireComplete } = useFormValidation();
  const info = useEvaluationStore((s) => s.info);
  const scores = useEvaluationStore((s) => s.scores);
  const saveEvaluation = useEvaluationStore((s) => s.saveEvaluation);
  const newEvaluation = useEvaluationStore((s) => s.newEvaluation);
  const [preview, setPreview] = useState<Uint8Array<ArrayBuffer> | null>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { setPreview(null); setStatus(''); }, [info, scores]);

  async function generate(download = false): Promise<boolean> {
    if (!requireComplete()) {
      setStatus('Error: completá todos los datos, observaciones, aclaraciones y puntajes obligatorios.');
      return false;
    }
    setLoading(true);
    setStatus('');
    try {
      const blob = await form.generate(info, scores);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      if (download) {
        const tipoFormulario = formId === 'fo-en-01'
          ? 'AuxiliarDeEnfermeria'
          : 'LicenciadoEnEnfermeria';
        const filename = `${nombreParaArchivo(info.name)}-${tipoFormulario}.pdf`;
        if (isTauri()) {
          const path = await save({
            title: 'Guardar evaluación CAMCEL',
            defaultPath: filename,
            filters: [{ name: 'Documento PDF', extensions: ['pdf'] }],
          });
          if (!path) {
            setStatus('Guardado cancelado. La evaluación sigue abierta.');
            return false;
          }
          // Solo se considera éxito cuando Windows confirma la escritura.
          await writeFile(path, bytes);
          // Deja disponible la evaluación en el historial, incluso si se usó Guardar PDF.
          try {
            const id = saveEvaluation();
            if (!verifySaved(id, formId)) throw new Error('No se confirmó el guardado local.');
          } catch (historyError) {
            console.error('PDF guardado, pero falló el historial:', historyError);
            setStatus(`El PDF se guardó en ${path}, pero no se pudo guardar la evaluación en el historial.`);
            return true;
          }
          newEvaluation();
          navigate('/', { state: { notice: 'PDF guardado correctamente y evaluación añadida al historial.' } });
          return true;
        } else {
          // El navegador no permite confirmar que terminó la descarga.
          const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
          setStatus('Descarga solicitada al navegador; podés volver al inicio manualmente.');
        }
      } else {
        setPreview(bytes);
        setStatus('Vista previa generada a partir del PDF original.');
      }
      return true;
    } catch (error) {
      console.error('Error PDF:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { preview, status, loading, generate, closePreview: () => setPreview(null) };
}
