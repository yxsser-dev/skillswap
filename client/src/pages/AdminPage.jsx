import { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { useToast } from '../context/ToastContext';
import ReportsPanel from '../components/admin/ReportsPanel';
import UsersPanel from '../components/admin/UsersPanel';
import ListingsPanel from '../components/admin/ListingsPanel';

export default function AdminPage() {
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [adminTab, setAdminTab] = useState('reports');

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await axiosClient.get('/admin/stats');
      setStats(data);
    } catch (e) {
      showToast('Could not load platform stats.', 'error');
    }
  }, [showToast]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (!stats) {
    return <p className="text-secondary">Loading platform stats…</p>;
  }

  return (
    <div>
      <h3 style={{ marginBottom: 'var(--space-5)' }}>Platform Overview</h3>

      <div className="grid-4" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        <div className="card">
          <h2 className="gradient-text" style={{ fontSize: 'var(--font-size-3xl)' }}>{stats.totalUsers}</h2>
          <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>Users Onboarded</p>
        </div>
        <div className="card">
          <h2 className="gradient-text" style={{ fontSize: 'var(--font-size-3xl)' }}>{stats.activeListings}</h2>
          <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>Active Listings</p>
        </div>
        <div className="card">
          <h2 className="gradient-text" style={{ fontSize: 'var(--font-size-3xl)' }}>{stats.totalBookings}</h2>
          <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>Swaps Booked</p>
        </div>
        <div className="card">
          <h2 className="gradient-text" style={{ fontSize: 'var(--font-size-3xl)' }}>{stats.pendingReports}</h2>
          <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>Pending Reports</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab${adminTab === 'reports' ? ' active' : ''}`} onClick={() => setAdminTab('reports')}>
          Reports
          {stats.pendingReports > 0 && <span className="tab-count">{stats.pendingReports}</span>}
        </button>
        <button className={`tab${adminTab === 'users' ? ' active' : ''}`} onClick={() => setAdminTab('users')}>
          Users
        </button>
        <button className={`tab${adminTab === 'listings' ? ' active' : ''}`} onClick={() => setAdminTab('listings')}>
          Listings
        </button>
      </div>

      {adminTab === 'reports' && <ReportsPanel onStatsChange={fetchStats} />}
      {adminTab === 'users' && <UsersPanel onStatsChange={fetchStats} />}
      {adminTab === 'listings' && <ListingsPanel onStatsChange={fetchStats} />}
    </div>
  );
}
