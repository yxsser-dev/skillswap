import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="empty-state" style={{ marginTop: 'var(--space-16)' }}>
      <div className="empty-state-icon">🧭</div>
      <div className="empty-state-title">Page not found</div>
      <p className="empty-state-text">The page you're looking for doesn't exist or may have moved.</p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: 'var(--space-4)', display: 'inline-block' }}>
        Back to Listings
      </Link>
    </div>
  );
}
