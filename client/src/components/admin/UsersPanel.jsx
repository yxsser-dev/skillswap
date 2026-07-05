import { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import { useToast } from '../../context/ToastContext';
import { useDialog } from '../../context/DialogContext';
import { SkeletonRows } from '../Skeleton';

export default function UsersPanel({ onStatsChange }) {
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await axiosClient.get('/admin/users');
      if (Array.isArray(data)) setUsers(data);
    } catch (e) {
      showToast('Could not load users.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleSuspend = async (targetUser) => {
    const willSuspend = !targetUser.is_suspended;
    const ok = await confirm({
      title: willSuspend ? 'Suspend this user?' : 'Unsuspend this user?',
      message: willSuspend
        ? `${targetUser.username} will be logged out and unable to sign in until unsuspended.`
        : `${targetUser.username} will regain access immediately.`,
      danger: willSuspend,
      confirmLabel: willSuspend ? 'Suspend' : 'Unsuspend'
    });
    if (!ok) return;

    try {
      await axiosClient.patch(`/admin/users/${targetUser.id}/suspend`, { is_suspended: willSuspend });
      showToast(`${targetUser.username} ${willSuspend ? 'suspended' : 'unsuspended'}.`, 'success');
      fetchUsers();
      onStatsChange?.();
    } catch (e) {
      showToast(e.response?.data?.error || 'Could not update user suspension.', 'error');
    }
  };

  if (loading) return <SkeletonRows count={4} />;

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td><strong>{u.username}</strong></td>
              <td className="text-secondary">{u.email}</td>
              <td><span className="badge badge-ghost" style={{ textTransform: 'capitalize' }}>{u.role}</span></td>
              <td>
                <span className={`badge ${u.is_suspended ? 'badge-danger' : 'badge-success'}`}>
                  {u.is_suspended ? 'Suspended' : 'Active'}
                </span>
              </td>
              <td className="text-right">
                {u.role !== 'admin' && (
                  <button
                    className={`btn btn-sm ${u.is_suspended ? 'btn-success' : 'btn-danger'}`}
                    onClick={() => toggleSuspend(u)}
                  >
                    {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
