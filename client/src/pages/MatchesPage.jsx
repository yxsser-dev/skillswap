import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import axiosClient from '../api/axiosClient';
import MatchCard from '../components/MatchCard';
import { SkeletonGrid } from '../components/Skeleton';

export default function MatchesPage() {
  const { showToast } = useToast();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axiosClient.get('/listings/matches');
        if (Array.isArray(data)) setMatches(data);
      } catch (e) {
        showToast('Could not load your matches.', 'error');
      } finally {
        setLoading(false);
      }
    })();
    
  }, []);

  return (
    <div>
      <h3 style={{ marginBottom: 'var(--space-1)' }}>Skill Matches</h3>
      <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', maxWidth: 640 }}>
        Ranked by mutual swap potential, average rating, and schedule overlap with your listings.
      </p>

      {loading ? (
        <SkeletonGrid count={4} />
      ) : matches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🤝</div>
          <div className="empty-state-title">No matches yet</div>
          <p className="empty-state-text">
            Post an "offering" and a "seeking" listing to start getting ranked matches.
          </p>
        </div>
      ) : (
        <div className="grid-3" style={{ marginTop: 'var(--space-5)' }}>
          {matches.map((m) => <MatchCard key={m.candidate.id} match={m} />)}
        </div>
      )}
    </div>
  );
}
