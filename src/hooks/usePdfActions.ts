import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { isTauri } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { useActiveEvaluationStore as useEvaluationStore, useCurrentForm, useCurrentFormId, useFormValidation } from '../formContext';

/** Safe filenames for Windows, without spaces, accents or forbidden characters. */
function nombreParaArchivo(value: string): string {
  const partes = (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return partes.map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1)).join('').slice(0, 80) || 'Funcionario';
}

export default function usePdfActions() {
  const navigate = useNavigate();
  const form = useCurrentForm();
  const formId = useCurrentFormId();
  const { requireComplete } = useFormValidation();
  const info = useEvaluationStore((s) => s.info);
  const scores = useEvaluationStore((s) => s.scores);
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
        const tipoFormulario = formId === 'fo-en-01' ? 'AuxiliarDeEnfermeria' : 'LicenciadoEnEnfermeria';
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
          // Return to Home only after the filesystem confirms the save.
          await writeFile(path, bytes);
          newEvaluation();
          navigate('/', { state: { notice: 'PDF guardado correctamente.' } });
          return true;
        }
        // Browser fallback, useful when testing with pnpm dev.
        const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        setStatus('Descarga solicitada al navegador; podés volver al inicio manualmente.');
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
