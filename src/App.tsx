import { Navigate, Route, Routes, useParams } from 'react-router';
import HomePage from './pages/HomePage';
import PcPage from './pages/PcPage';
import { FormProvider } from './formContext';
import type { FormId } from './formContext';

function FormRoute() {
  const { formId } = useParams();
  if (formId !== 'fo-en-01' && formId !== 'fo-en-02') {
    return <Navigate to="/" replace />;
  }
  return <FormProvider key={formId} id={formId as FormId}><PcPage /></FormProvider>;
}

export default function App() {
  return <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/home" element={<Navigate to="/" replace />} />
    <Route path="/formularios/:formId" element={<FormRoute />} />
    <Route path="/formularios/fo-en-01/pc" element={<Navigate to="/formularios/fo-en-01" replace />} />
    <Route path="/formularios/fo-en-02/pc" element={<Navigate to="/formularios/fo-en-02" replace />} />
    <Route path="/pc" element={<Navigate to="/formularios/fo-en-01" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
