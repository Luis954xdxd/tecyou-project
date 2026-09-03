import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { applyAvatarFallback } from '../utils/avatarFallback';
import {
  Activity,
  ArrowLeft,
  Ban,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  FileWarning,
  Eye,
  EyeOff,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { getSessionToken } from '../utils/authStorage';
import '../styles/admin.css';

const API_BASE = 'http://localhost:5000';
const ADMIN_ROLES = ['moderator', 'admin', 'super_admin'];

const roleLabels = {
  user: 'Usuario',
  moderator: 'Moderador',
  admin: 'Administrador',
  super_admin: 'Superadministrador',
};

const statusLabels = {
  active: 'Activo',
  warned: 'Advertido',
  suspended: 'Suspendido',
  disabled: 'Deshabilitado',
};

const formatDate = (value) => {
  if (!value) return 'Sin actividad reciente';
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const avatarUrl = (value) => {
  if (!value) return '';
  return value.startsWith('http') ? value : `${API_BASE}${value}`;
};

function AdminPage({ currentUser, onBackToFeed, onLogout }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportStatus, setReportStatus] = useState('pending');
  const [reportFilters, setReportFilters] = useState({
    target_type: 'all',
    reason: 'all',
    search: '',
    from: '',
    to: '',
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [actionUser, setActionUser] = useState(null);
  const [actionForm, setActionForm] = useState({ status: 'warned', reason: '', suspended_until: '' });
  const [saving, setSaving] = useState(false);
  const [reportAction, setReportAction] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);

  const api = useMemo(() => axios.create({
    baseURL: `${API_BASE}/api/admin`,
    headers: { Authorization: `Bearer ${getSessionToken()}` },
  }), []);

  const handleApiError = useCallback((requestError, fallback) => {
    if (requestError.response?.status === 401) {
      setSessionExpired(true);
      setOverview(null);
      setUsers([]);
      setReports([]);
      setAuditLogs([]);
      setError(requestError.response?.data?.error || 'Sesion invalida o vencida.');
      return;
    }
    if (requestError.response?.status === 403) {
      setError(requestError.response?.data?.error || 'Tu sesion no tiene acceso administrativo.');
      return;
    }
    setError(requestError.response?.data?.error || fallback);
  }, []);

  const loadOverview = useCallback(async () => {
    try {
      const response = await api.get('/overview');
      setOverview(response.data);
    } catch (requestError) {
      handleApiError(requestError, 'No se pudo cargar el resumen administrativo.');
    }
  }, [api, handleApiError]);

  const loadUsers = useCallback(async () => {
    try {
      const response = await api.get('/users', { params: { search, status: statusFilter } });
      setUsers(response.data.users || []);
    } catch (requestError) {
      handleApiError(requestError, 'No se pudieron cargar los usuarios.');
    }
  }, [api, handleApiError, search, statusFilter]);

  const loadAudit = useCallback(async () => {
    if (!['admin', 'super_admin'].includes(currentUser.system_role)) return;
    try {
      const response = await api.get('/audit');
      setAuditLogs(response.data.logs || []);
    } catch (requestError) {
      handleApiError(requestError, 'No se pudo cargar la auditoria.');
    }
  }, [api, currentUser.system_role, handleApiError]);

  const loadReports = useCallback(async () => {
    try {
      const response = await api.get('/reports', { params: { status: reportStatus, ...reportFilters } });
      setReports(response.data.reports || []);
    } catch (requestError) {
      handleApiError(requestError, 'No se pudieron cargar los reportes.');
    }
  }, [api, handleApiError, reportFilters, reportStatus]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      if (activeSection === 'overview') await loadOverview();
      if (activeSection === 'audit') await loadAudit();
      if (activeSection === 'reports') await loadReports();
      setLoading(false);
    };
    load();
  }, [activeSection, loadAudit, loadOverview, loadReports]);

  useEffect(() => {
    if (activeSection !== 'users') return undefined;
    const timer = setTimeout(loadUsers, 300);
    return () => clearTimeout(timer);
  }, [activeSection, loadUsers]);

  const updateLocalUser = (id, changes) => {
    setUsers((current) => current.map((item) => Number(item.id) === Number(id) ? { ...item, ...changes } : item));
  };

  const submitStatus = async (event) => {
    event.preventDefault();
    if (!actionUser) return;
    setSaving(true);
    setError('');
    try {
      const response = await api.patch(`/users/${actionUser.id}/status`, actionForm);
      updateLocalUser(actionUser.id, response.data.user);
      setNotice(`Estado de ${actionUser.display_name || actionUser.fullname} actualizado.`);
      setActionUser(null);
      setActionForm({ status: 'warned', reason: '', suspended_until: '' });
      setTimeout(() => setNotice(''), 3500);
    } catch (requestError) {
      handleApiError(requestError, 'No se pudo actualizar la cuenta.');
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (targetUser, systemRole) => {
    try {
      const response = await api.patch(`/users/${targetUser.id}/role`, {
        system_role: systemRole,
        reason: 'Asignacion desde el panel administrativo',
      });
      updateLocalUser(targetUser.id, response.data.user);
      setNotice(`Rol de ${targetUser.display_name || targetUser.fullname} actualizado.`);
      setTimeout(() => setNotice(''), 3500);
    } catch (requestError) {
      handleApiError(requestError, 'No se pudo cambiar el rol.');
    }
  };

  const processReport = async (report, action, note = '') => {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/reports/${report.id}`, { action, note });
      setReports((current) => current.filter((item) => Number(item.id) !== Number(report.id)));
      setReportAction(null);
      setResolutionNote('');
      setNotice(action === 'hide_content' ? 'La publicacion fue ocultada y el reporte quedo resuelto.' : 'El reporte fue actualizado.');
      setTimeout(() => setNotice(''), 3500);
      loadOverview();
    } catch (requestError) {
      handleApiError(requestError, 'No se pudo procesar el reporte.');
    } finally {
      setSaving(false);
    }
  };

  const reasonLabels = {
    harassment: 'Acoso, insultos o amenazas',
    inappropriate: 'Contenido inapropiado',
    impersonation: 'Suplantacion de identidad',
    spam: 'Spam o contenido repetitivo',
    false_information: 'Informacion falsa',
    personal_information: 'Informacion personal',
    other: 'Otro motivo',
  };

  const targetTypeLabels = {
    all: 'Todos los contenidos',
    recognition: 'Publicaciones',
    comment: 'Comentarios',
    profile: 'Perfiles',
    story: 'Historias',
    chat_message: 'Mensajes privados',
  };

  const renderBarChart = (title, description, data = []) => {
    const values = Array.isArray(data) ? data : [];
    const max = Math.max(...values.map((item) => Number(item.total || 0)), 1);
    return (
      <article className="admin-chart-card">
        <div className="admin-chart-heading">
          <span><BarChart3 size={18} /></span>
          <div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        </div>
        <div className="admin-bar-chart">
          {values.length === 0 ? (
            <small>Sin datos suficientes.</small>
          ) : values.map((item) => {
            const total = Number(item.total || 0);
            return (
              <div className="admin-bar-row" key={item.label}>
                <span>{item.label}</span>
                <div><i style={{ width: `${Math.max((total / max) * 100, total ? 8 : 0)}%` }} /></div>
                <strong>{total}</strong>
              </div>
            );
          })}
        </div>
      </article>
    );
  };

  if (!ADMIN_ROLES.includes(currentUser?.system_role)) {
    return (
      <main className="admin-access-denied">
        <ShieldCheck size={42} />
        <h1>Acceso restringido</h1>
        <p>Esta cuenta no tiene permisos administrativos.</p>
        <button type="button" onClick={onBackToFeed}>Volver al feed</button>
      </main>
    );
  }

  const totals = overview?.totals || {};
  const metricCards = [
    { label: 'Usuarios registrados', value: totals.users || 0, icon: Users, tone: 'blue' },
    { label: 'Reconocimientos', value: totals.recognitions || 0, icon: GraduationCap, tone: 'violet' },
    { label: 'Reportes pendientes', value: totals.pending_reports || 0, icon: FileWarning, tone: 'amber' },
    { label: 'Cuentas suspendidas', value: totals.suspended_users || 0, icon: Ban, tone: 'red' },
    { label: 'Activos 24h', value: totals.active_users_24h || 0, icon: Activity, tone: 'green' },
    { label: 'Publicaciones semana', value: totals.weekly_recognitions || 0, icon: ClipboardList, tone: 'blue' },
    { label: 'Reportes resueltos', value: totals.resolved_reports || 0, icon: CheckCircle2, tone: 'green' },
    { label: 'Categoria destacada', value: totals.top_category || 'Sin datos', icon: GraduationCap, tone: 'violet' },
  ];

  return (
    <div className="admin-app-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark"><ShieldCheck size={24} /></span>
          <div><strong>Tec You</strong><small>Administracion TSJ</small></div>
        </div>

        <nav className="admin-navigation" aria-label="Navegacion administrativa">
          <button className={activeSection === 'overview' ? 'active' : ''} onClick={() => setActiveSection('overview')}>
            <LayoutDashboard size={19} /> Resumen
          </button>
          <button className={activeSection === 'users' ? 'active' : ''} onClick={() => setActiveSection('users')}>
            <Users size={19} /> Usuarios
          </button>
          <button className={activeSection === 'reports' ? 'active' : ''} onClick={() => setActiveSection('reports')}>
            <ClipboardList size={19} /> Reportes <span className="admin-nav-count">{totals.pending_reports || 0}</span>
          </button>
          {['admin', 'super_admin'].includes(currentUser.system_role) && (
            <button className={activeSection === 'audit' ? 'active' : ''} onClick={() => setActiveSection('audit')}>
              <Activity size={19} /> Auditoria
            </button>
          )}
        </nav>

        <div className="admin-sidebar-footer">
          <button type="button" onClick={onBackToFeed}><ArrowLeft size={18} /> Volver al feed</button>
          <button type="button" onClick={onLogout}><LogOut size={18} /> Cerrar sesion</button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-eyebrow">Panel institucional</span>
            <h1>{activeSection === 'overview' ? 'Resumen general' : activeSection === 'users' ? 'Gestion de usuarios' : activeSection === 'audit' ? 'Registro de auditoria' : 'Moderacion de reportes'}</h1>
          </div>
          <div className="admin-account-chip">
            {currentUser.profile_image_url ? (
              <img src={avatarUrl(currentUser.profile_image_url)} alt={currentUser.display_name || currentUser.fullname} onError={(event) => applyAvatarFallback(event, currentUser.display_name || currentUser.fullname)} />
            ) : (
              <span>{(currentUser.display_name || currentUser.fullname || 'A').charAt(0)}</span>
            )}
            <div><strong>{currentUser.display_name || currentUser.fullname}</strong><small>{roleLabels[currentUser.system_role]}</small></div>
          </div>
        </header>

        {notice && <div className="admin-notice"><CheckCircle2 size={18} /> {notice}</div>}
        {error && (
          <div className="admin-error">
            <FileWarning size={18} /> {error}
            {sessionExpired && <button type="button" className="admin-error-action" onClick={onLogout}>Iniciar sesion</button>}
            <button onClick={() => setError('')}><X size={16} /></button>
          </div>
        )}
        {loading && <div className="admin-loading">Cargando informacion...</div>}

        {!loading && activeSection === 'overview' && (
          <div className="admin-dashboard-content">
            <section className="admin-metrics">
              {metricCards.map(({ label, value, icon: Icon, tone }) => (
                <article className="admin-metric-card" key={label}>
                  <span className={`admin-metric-icon ${tone}`}><Icon size={22} /></span>
                  <div><small>{label}</small><strong>{value}</strong></div>
                </article>
              ))}
            </section>
            <section className="admin-panel-card">
              <div className="admin-section-heading"><div><h2>Actividad de cuentas</h2><p>Usuarios con actividad o registro reciente.</p></div><button onClick={() => setActiveSection('users')}>Ver usuarios</button></div>
              <div className="admin-recent-list">
                {(overview?.recent_users || []).map((item) => (
                  <div className="admin-recent-user" key={item.id}>
                    {item.profile_image_url ? <img src={avatarUrl(item.profile_image_url)} alt="" onError={(event) => applyAvatarFallback(event, item.display_name || item.fullname)} /> : <span>{(item.display_name || item.fullname).charAt(0)}</span>}
                    <div><strong>{item.display_name || item.fullname}</strong><small>{item.email}</small></div>
                    <span className={`admin-status ${item.account_status}`}>{statusLabels[item.account_status] || 'Activo'}</span>
                    <time>{formatDate(item.last_login_at || item.created_at)}</time>
                  </div>
                ))}
              </div>
            </section>
            <section className="admin-charts-grid">
              {renderBarChart('Usuarios activos', 'Actividad registrada durante los ultimos 7 dias.', overview?.charts?.active_users_by_day)}
              {renderBarChart('Publicaciones por semana', 'Reconocimientos creados en las ultimas 6 semanas.', overview?.charts?.posts_by_week)}
              {renderBarChart('Reportes por estado', 'Distribucion actual de moderacion.', overview?.charts?.reports_by_status)}
              {renderBarChart('Categorias mas usadas', 'Categorias con mas reconocimientos.', overview?.charts?.categories)}
            </section>
          </div>
        )}

        {!loading && activeSection === 'users' && (
          <section className="admin-panel-card admin-users-panel">
            <div className="admin-users-toolbar">
              <label><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o correo..." /></label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="warned">Advertidos</option>
                <option value="suspended">Suspendidos</option>
                <option value="disabled">Deshabilitados</option>
              </select>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-users-table">
                <thead><tr><th>Usuario</th><th>Rol academico</th><th>Acceso</th><th>Estado</th><th>Ultimo acceso</th><th>Acciones</th></tr></thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item.id}>
                      <td><div className="admin-table-user">{item.profile_image_url ? <img src={avatarUrl(item.profile_image_url)} alt="" onError={(event) => applyAvatarFallback(event, item.display_name || item.fullname)} /> : <span>{(item.display_name || item.fullname).charAt(0)}</span>}<div><strong>{item.display_name || item.fullname}</strong><small>{item.email}</small></div></div></td>
                      <td>{item.role === 'teacher' ? 'Docente' : item.role === 'staff' ? 'Personal' : 'Estudiante'}</td>
                      <td>
                        {currentUser.system_role === 'super_admin' ? (
                          <select className="admin-role-select" value={item.system_role || 'user'} onChange={(e) => changeRole(item, e.target.value)} disabled={Number(item.id) === Number(currentUser.id)}>
                            {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                          </select>
                        ) : roleLabels[item.system_role] || 'Usuario'}
                      </td>
                      <td><span className={`admin-status ${item.account_status}`}>{statusLabels[item.account_status] || item.account_status}</span></td>
                      <td>{formatDate(item.last_login_at)}</td>
                      <td><button className="admin-manage-btn" onClick={() => { setActionUser(item); setActionForm({ status: item.account_status === 'active' ? 'warned' : 'active', reason: '', suspended_until: '' }); }} disabled={Number(item.id) === Number(currentUser.id) || currentUser.system_role === 'moderator'}><UserCog size={17} /> Gestionar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <p className="admin-empty">No hay usuarios que coincidan con los filtros.</p>}
            </div>
          </section>
        )}

        {!loading && activeSection === 'audit' && (
          <section className="admin-panel-card">
            <div className="admin-section-heading"><div><h2>Acciones administrativas</h2><p>Registro inalterable de cambios sensibles.</p></div></div>
            <div className="admin-audit-list">
              {auditLogs.map((log) => <article key={log.id}><span><Activity size={17} /></span><div><strong>{log.actor_name}</strong><p>{log.action.replaceAll('_', ' ')} sobre {log.target_type} #{log.target_id}</p>{log.reason && <small>Motivo: {log.reason}</small>}</div><time>{formatDate(log.created_at)}</time></article>)}
              {auditLogs.length === 0 && <p className="admin-empty">Aun no existen acciones administrativas registradas.</p>}
            </div>
          </section>
        )}

        {!loading && activeSection === 'reports' && (
          <section className="admin-reports-section">
            <div className="admin-report-tabs">
              {[['pending', 'Pendientes'], ['reviewing', 'En revision'], ['resolved', 'Resueltos'], ['dismissed', 'Descartados'], ['all', 'Todos']].map(([value, label]) => (
                <button key={value} className={reportStatus === value ? 'active' : ''} onClick={() => setReportStatus(value)}>{label}</button>
              ))}
            </div>
            <div className="admin-report-filters">
              <label>
                <Search size={17} />
                <input
                  value={reportFilters.search}
                  onChange={(event) => setReportFilters((current) => ({ ...current, search: event.target.value }))}
                  placeholder="Buscar usuario, contenido o contexto..."
                />
              </label>
              <select
                value={reportFilters.target_type}
                onChange={(event) => setReportFilters((current) => ({ ...current, target_type: event.target.value }))}
              >
                {Object.entries(targetTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <select
                value={reportFilters.reason}
                onChange={(event) => setReportFilters((current) => ({ ...current, reason: event.target.value }))}
              >
                <option value="all">Todos los motivos</option>
                {Object.entries(reasonLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <input
                type="date"
                value={reportFilters.from}
                onChange={(event) => setReportFilters((current) => ({ ...current, from: event.target.value }))}
                aria-label="Fecha inicial"
              />
              <input
                type="date"
                value={reportFilters.to}
                onChange={(event) => setReportFilters((current) => ({ ...current, to: event.target.value }))}
                aria-label="Fecha final"
              />
            </div>
            <details className="admin-report-help">
              <summary>Que hace cada opcion de moderacion</summary>
              <div>
                <p><strong>Tomar revision:</strong> indica que un moderador ya esta investigando el caso. El contenido permanece visible.</p>
                <p><strong>Descartar:</strong> cierra el reporte cuando no existe una infraccion, es duplicado o carece de fundamento.</p>
                <p><strong>Resolver sin ocultar:</strong> cierra el caso sin retirar el contenido, por ejemplo cuando se aplica una advertencia o no es necesario ocultarlo.</p>
                <p><strong>Ocultar contenido:</strong> lo retira de la vista publica, pero conserva la evidencia y la decision en auditoria.</p>
              </div>
            </details>
            <div className="admin-report-list">
              {reports.map((report) => {
                const firstMedia = Array.isArray(report.media) ? report.media[0] : null;
                const mediaPath = firstMedia?.media_url || report.target_media_url;
                const mediaType = firstMedia?.media_type || report.target_media_type;
                const mediaSrc = mediaPath ? avatarUrl(mediaPath) : '';
                const targetLabels = { recognition: 'Publicacion', comment: 'Comentario', profile: 'Perfil', story: 'Historia', chat_message: 'Mensaje privado reportado' };
                return (
                  <article className="admin-report-card" key={report.id}>
                    <div className="admin-report-head">
                      <span className={`admin-status ${report.status}`}>{report.status === 'pending' ? 'Pendiente' : report.status === 'reviewing' ? 'En revision' : report.status === 'resolved' ? 'Resuelto' : 'Descartado'}</span>
                      <time>{formatDate(report.created_at)}</time>
                    </div>
                    <div className="admin-report-reason"><FileWarning size={18} /><div><strong>{reasonLabels[report.reason] || report.reason}</strong><span>Reportado por {report.reporter_name}</span></div></div>
                    {Number(report.target_report_count || 0) >= 3 && (
                      <div className="admin-report-alert">
                        Este contenido acumula {report.target_report_count} reportes. Conviene revisarlo con prioridad.
                      </div>
                    )}
                    <div className="admin-reported-content">
                      {mediaSrc && (['video', 'audio'].includes(mediaType) ? mediaType === 'audio' ? <audio src={mediaSrc} controls /> : <video src={mediaSrc} controls /> : <img src={mediaSrc} alt="Contenido reportado" />)}
                      <div><small>{targetLabels[report.target_type] || 'Contenido'} de {report.author_name || 'Usuario desconocido'}</small><strong>{report.content_category || targetLabels[report.target_type] || 'Contenido'}</strong><p>{report.content_text || 'Contenido multimedia sin texto.'}</p></div>
                    </div>
                    {report.details && <p className="admin-report-details"><strong>Contexto del reporte:</strong> {report.details}</p>}
                    {report.resolution_note && <p className="admin-report-resolution"><strong>Resolucion:</strong> {report.resolution_note}</p>}
                    {['pending', 'reviewing'].includes(report.status) && (
                      <div className="admin-report-actions">
                        {report.status === 'pending' && <button onClick={() => processReport(report, 'review')}><Eye size={17} /> Tomar revision</button>}
                        <button onClick={() => { setReportAction({ report, action: 'dismiss' }); setResolutionNote(''); }}>Descartar</button>
                        <button onClick={() => { setReportAction({ report, action: 'resolve' }); setResolutionNote(''); }}><CheckCircle2 size={17} /> Resolver sin ocultar</button>
                        {report.target_type === 'profile' ? (
                          <button onClick={() => { setSearch(report.author_name || ''); setActiveSection('users'); }}><UserCog size={17} /> Gestionar cuenta</button>
                        ) : (
                          <button className="danger" onClick={() => { setReportAction({ report, action: 'hide_content' }); setResolutionNote(''); }}><EyeOff size={17} /> Ocultar contenido</button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
              {reports.length === 0 && <div className="admin-panel-card admin-empty"><ClipboardList size={34} /><p>No hay reportes en esta bandeja.</p></div>}
            </div>
          </section>
        )}
      </main>

      {actionUser && (
        <div className="admin-modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && setActionUser(null)}>
          <form className="admin-action-modal" onSubmit={submitStatus}>
            <button type="button" className="admin-modal-close" onClick={() => setActionUser(null)}><X size={20} /></button>
            <span className="admin-modal-icon"><UserCog size={24} /></span>
            <h2>Gestionar cuenta</h2>
            <p>{actionUser.display_name || actionUser.fullname}<small>{actionUser.email}</small></p>
            <label>Nuevo estado<select value={actionForm.status} onChange={(e) => setActionForm((current) => ({ ...current, status: e.target.value }))}><option value="active">Activo</option><option value="warned">Advertido</option><option value="suspended">Suspendido</option><option value="disabled">Deshabilitado</option></select></label>
            {actionForm.status === 'suspended' && <label>Suspension hasta<input type="datetime-local" value={actionForm.suspended_until} onChange={(e) => setActionForm((current) => ({ ...current, suspended_until: e.target.value }))} /></label>}
            <label>Motivo<textarea value={actionForm.reason} onChange={(e) => setActionForm((current) => ({ ...current, reason: e.target.value }))} placeholder="Explica claramente la razon de esta accion..." required minLength={5} /></label>
            <div className="admin-modal-actions"><button type="button" onClick={() => setActionUser(null)}>Cancelar</button><button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Confirmar cambio'}</button></div>
          </form>
        </div>
      )}

      {reportAction && (
        <div className="admin-modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && setReportAction(null)}>
          <form className="admin-action-modal" onSubmit={(event) => { event.preventDefault(); processReport(reportAction.report, reportAction.action, resolutionNote); }}>
            <button type="button" className="admin-modal-close" onClick={() => setReportAction(null)}><X size={20} /></button>
            <span className="admin-modal-icon"><ClipboardList size={24} /></span>
            <h2>{reportAction.action === 'hide_content' ? 'Ocultar contenido' : reportAction.action === 'dismiss' ? 'Descartar reporte' : 'Resolver reporte'}</h2>
            <p>Esta decision quedara registrada en la auditoria administrativa.</p>
            <label>Nota de resolucion<textarea value={resolutionNote} onChange={(event) => setResolutionNote(event.target.value)} placeholder="Explica el criterio aplicado..." minLength={5} required /></label>
            <div className="admin-modal-actions"><button type="button" onClick={() => setReportAction(null)}>Cancelar</button><button type="submit" disabled={saving || resolutionNote.trim().length < 5}>{saving ? 'Procesando...' : 'Confirmar'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
