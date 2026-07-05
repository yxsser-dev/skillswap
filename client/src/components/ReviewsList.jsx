export default function ReviewsList({ reviews }) {
  if (!reviews || reviews.length === 0) {
    return <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>No reviews yet.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {reviews.map((r) => (
        <div key={r.id} style={{ borderBottom: '1px solid var(--color-divider)', paddingBottom: 'var(--space-4)' }}>
          <div className="flex-between">
            <strong>{r.reviewer_name}</strong>
            <span>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
          </div>
          {r.comment && (
            <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>
              {r.comment}
            </p>
          )}
          <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-1)' }}>
            {new Date(r.created_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}
