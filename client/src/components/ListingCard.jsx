import { Link } from 'react-router-dom';

export default function ListingCard({ listing, currentUser, bookingDate, onDateChange, onBook, onReport }) {
  const isOwnListing = currentUser && currentUser.id === listing.user_id;
  const isOffering = listing.type === 'offering';

  return (
    <div className="card-glass card-interactive">
      <div className="listing-type-row">
        <span className={`badge ${isOffering ? 'badge-secondary' : 'badge-primary'}`}>
          {isOffering ? 'Offering' : 'Seeking'}
        </span>
        <span className="badge badge-ghost" style={{ textTransform: 'capitalize' }}>
          {listing.proficiency_level}
        </span>
      </div>

      <h4 style={{ marginBottom: 'var(--space-2)' }}>{listing.skill_name}</h4>
      <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)' }}>
        {listing.description}
      </p>
      <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>
        Posted by <Link to={`/users/${listing.user_id}`}>{listing.username}</Link>
      </p>

      {currentUser && !isOwnListing && (
        <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <input
            type="datetime-local"
            className="input"
            value={bookingDate || ''}
            onChange={(e) => onDateChange(listing.id, e.target.value)}
            required
          />
          <button className="btn btn-primary w-full" onClick={() => onBook(listing)}>
            Book Swap Session
          </button>
          <button className="btn btn-ghost btn-sm w-full" onClick={() => onReport(listing)}>
            🚩 Report Listing
          </button>
        </div>
      )}
    </div>
  );
}
