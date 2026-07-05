import { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import { useToast } from '../../context/ToastContext';
import { useDialog } from '../../context/DialogContext';
import { SkeletonRows } from '../Skeleton';

export default function ListingsPanel({ onStatsChange }) {
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = useCallback(async () => {
    try {
      const { data } = await axiosClient.get('/admin/listings');
      if (Array.isArray(data)) setListings(data);
    } catch (e) {
      showToast('Could not load listings.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const forceDelete = async (listing) => {
    const ok = await confirm({
      title: 'Force-remove this listing?',
      message: `"${listing.skill_name}" by ${listing.username} will be deactivated immediately. This cannot be undone from the UI.`,
      danger: true,
      confirmLabel: 'Remove Listing'
    });
    if (!ok) return;

    try {
      await axiosClient.delete(`/admin/listings/${listing.id}`);
      showToast('Listing removed.', 'success');
      fetchListings();
      onStatsChange?.();
    } catch (e) {
      showToast(e.response?.data?.error || 'Could not delete listing.', 'error');
    }
  };

  if (loading) return <SkeletonRows count={4} />;

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Skill</th>
            <th>Type</th>
            <th>Owner</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {listings.map((l) => (
            <tr key={l.id}>
              <td><strong>{l.skill_name}</strong></td>
              <td><span className="badge badge-ghost" style={{ textTransform: 'capitalize' }}>{l.type}</span></td>
              <td className="text-secondary">
                {l.username}{l.owner_suspended && <span className="badge badge-danger" style={{ marginLeft: 'var(--space-2)' }}>Suspended owner</span>}
              </td>
              <td>
                <span className={`badge ${l.is_active ? 'badge-success' : 'badge-ghost'}`}>
                  {l.is_active ? 'Active' : 'Removed'}
                </span>
              </td>
              <td className="text-right">
                {l.is_active && (
                  <button className="btn btn-danger btn-sm" onClick={() => forceDelete(l)}>Force Remove</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
