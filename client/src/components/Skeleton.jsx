export function SkeletonCard() {
  return (
    <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div className="skeleton" style={{ height: '1.25rem', width: '60%' }} />
      <div className="skeleton" style={{ height: '0.875rem', width: '90%' }} />
      <div className="skeleton" style={{ height: '0.875rem', width: '75%' }} />
      <div className="skeleton" style={{ height: '2.5rem', width: '100%', marginTop: 'var(--space-2)' }} />
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid-3" style={{ marginTop: 'var(--space-5)' }}>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex-between" style={{ padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-divider)' }}>
      <div className="skeleton" style={{ height: '1rem', width: '40%' }} />
      <div className="skeleton" style={{ height: '2rem', width: '5.5rem', borderRadius: 'var(--radius-md)' }} />
    </div>
  );
}

export function SkeletonRows({ count = 4 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  );
}
