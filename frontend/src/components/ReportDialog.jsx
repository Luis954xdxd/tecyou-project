import React, { useState } from 'react';
import axios from 'axios';
import { Flag, X } from 'lucide-react';

const API_BASE = 'http://localhost:5000';
const reasons = [
  ['harassment', 'Acoso, insultos o amenazas'],
  ['inappropriate', 'Contenido inapropiado'],
  ['impersonation', 'Suplantacion de identidad'],
  ['spam', 'Spam o contenido repetitivo'],
  ['false_information', 'Informacion falsa'],
  ['personal_information', 'Expone informacion personal'],
  ['other', 'Otro motivo'],
];

function ReportDialog({ targetType, targetId, title, author, preview, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setError('');
    try {
      const response = await axios.post(`${API_BASE}/api/reports`, {
        target_type: targetType,
        target_id: targetId,
        reason,
        details,
      });
      onSuccess?.(response.data?.message || 'Reporte enviado a moderacion.');
      onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudo enviar el reporte.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="tec-report-overlay" role="dialog" aria-modal="true" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="tec-report-modal" onSubmit={submit}>
        <button type="button" className="tec-report-close icon-close" onClick={onClose} aria-label="Cerrar"><X size={19} /></button>
        <span className="tec-report-icon"><Flag size={23} /></span>
        <h2>{title || 'Reportar contenido'}</h2>
        <p>Moderacion revisara el contenido y su contexto. La identidad de quien reporta no se muestra al autor.</p>
        {(author || preview) && <div className="tec-report-preview">{author && <strong>{author}</strong>}{preview && <span>{preview}</span>}</div>}
        <fieldset>
          <legend>Selecciona un motivo</legend>
          {reasons.map(([value, label]) => <label key={value} className={reason === value ? 'selected' : ''}><input type="radio" name={`reason-${targetType}-${targetId}`} value={value} checked={reason === value} onChange={(event) => setReason(event.target.value)} /><span>{label}</span></label>)}
        </fieldset>
        <label className="tec-report-details">Informacion adicional <small>Opcional, excepto en “Otro motivo”</small><textarea value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Ayuda al moderador a entender lo ocurrido..." maxLength={1000} minLength={reason === 'other' ? 8 : undefined} required={reason === 'other'} /></label>
        {error && <p className="tec-report-inline-error">{error}</p>}
        <div className="tec-report-actions"><button type="button" onClick={onClose}>Cancelar</button><button type="submit" disabled={!reason || sending}>{sending ? 'Enviando...' : 'Enviar reporte'}</button></div>
      </form>
    </div>
  );
}

export default ReportDialog;
