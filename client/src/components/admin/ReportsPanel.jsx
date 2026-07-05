import { useState, useEffect, useCallback, Fragment } from 'react';
import axiosClient from '../../api/axiosClient';
import { useToast } from '../../context/ToastContext';
import { SkeletonRows } from '../Skeleton';

const STATUS_BADGE = { pending: 'badge-warning', resolved: 'badge-success', dismissed: 'badge-ghost' };

export default function ReportsPanel({ onStatsChange }) {
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [resolutionNotes, setResolutionNotes] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    try {
      const { data } = await axiosClient.get('/admin/reports');
      if (Array.isArray(data)) setReports(data);
    } catch (e) {
      showToast('Could not load reports.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const resolveReport = async (reportId, status) => {
    try {
      await axiosClient.patch(`/admin/reports/${reportId}/resolve`, {
        status,
        resolution_note: resolutionNotes[reportId] || ''
      });
      showToast(status === 'resolved' ? 'Report marked resolved.' : 'Report dismissed.', 'success');
      fetchReports();
      onStatsChange?.();
    } catch (e) {
      showToast(e.response?.data?.error || 'Could not update report.', 'error');
    }
  };

  if (loading) return <SkeletonRows count={4} />;

  if (reports.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🚩</div>
        <div className="empty-state-title">No reports filed</div>
        <p className="empty-state-text">Reports filed by users against listings or other members will show up here.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Reported</th>
            <th>Reporter</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Filed</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <Fragment key={r.id}>
              <tr onClick={() => setExpandedId(expandedId === r.id ? null : r.id)} style={{ cursor: 'pointer' }}>
                <td><strong>{r.reported_username}</strong></td>
                <td>{r.reporter_name || 'Unknown'}</td>
                <td className="truncate" style={{ maxWidth: 260 }}>{r.reason}</td>
                <td><span className={`badge ${STATUS_BADGE[r.status] || 'badge-ghost'}`}>{r.status}</span></td>
                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="text-right">{r.status === 'pending' ? '▾' : ''}</td>
              </tr>
              {expandedId === r.id && r.status === 'pending' && (
                <tr>
                  <td colSpan={6}>
                    <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                      <textarea
                        className="textarea"
                        rows="2"
                        placeholder="Optional resolution note..."
                        value={resolutionNotes[r.id] || ''}
                        onChange={(e) => setResolutionNotes({ ...resolutionNotes, [r.id]: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex" style={{ gap: 'var(--space-2)' }}>
                      <button className="btn btn-success btn-sm" onClick={() => resolveReport(r.id, 'resolved')}>Mark Resolved</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => resolveReport(r.id, 'dismissed')}>Dismiss</button>
                    </div>
                  </td>
                </tr>
              )}
              {expandedId === r.id && r.status !== 'pending' && r.resolution_note && (
                <tr>
                  <td colSpan={6} className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                    <strong>Resolution note:</strong> {r.resolution_note}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
