const ICON = { listing: '📌', review_received: '⭐', booking_completed: '✅' };

function describeActivity(item) {
  switch (item.type) {
    case 'listing':
      return `Posted a listing for "${item.skill_name}"`;
    case 'review_received':
      return item.detail ? `Received a review: "${item.detail}"` : 'Received a review';
    case 'booking_completed':
      return `Completed a swap session${item.skill_name ? ` for "${item.skill_name}"` : ''}`;
    default:
      return 'Activity';
  }
}

export default function ActivityTimeline({ items }) {
  if (!items || items.length === 0) {
    return <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>No activity yet.</p>;
  }

  return (
    <div className="timeline">
      {items.map((item, idx) => (
        <div className="timeline-item" key={idx}>
          <div className="timeline-dot" />
          <div className="timeline-content">
            <div className="timeline-text">
              <span aria-hidden="true" style={{ marginRight: 'var(--space-2)' }}>{ICON[item.type] || '•'}</span>
              {describeActivity(item)}
            </div>
            <div className="timeline-time">{new Date(item.event_time).toLocaleDateString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
