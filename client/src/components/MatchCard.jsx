import { Link } from 'react-router-dom';

export default function MatchCard({ match }) {
  return (
    <div className="card-glass card-interactive" style={{ display: 'flex', gap: 'var(--space-4)' }}>
      <div className="score-circle" title={`Match score: ${match.score}`}>
        {match.score}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{ marginBottom: 'var(--space-1)' }}>
          <Link to={`/users/${match.candidate.id}`}>{match.candidate.username}</Link>
        </h4>
        <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>
          {match.candidate.bio || 'No bio provided.'}
        </p>
        <div>
          {match.reasons.map((r, idx) => (
            <span key={idx} className="reason-tag">{r}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
