const STATUS_BADGE = {
  pending: 'badge-warning',
  accepted: 'badge-secondary',
  completed: 'badge-success',
  rejected: 'badge-danger',
  cancelled: 'badge-ghost'
};

export default function BookingCard({ booking, currentUser, onUpdateStatus, onLeaveReview }) {
  return (
    <div className="card-glass">
      <div className="flex-between" style={{ marginBottom: 'var(--space-3)' }}>
        <h4 style={{ margin: 0 }}>{booking.skill_name || 'Skill Swap'}</h4>
        <span className={`badge ${STATUS_BADGE[booking.status] || 'badge-ghost'}`} style={{ textTransform: 'capitalize' }}>
          {booking.status}
        </span>
      </div>
      <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>Teacher: {booking.teacher_name}</p>
      <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>Learner: {booking.learner_name}</p>
      <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-2)' }}>
        Scheduled: {new Date(booking.session_time).toLocaleString()}
      </p>

      {booking.status === 'pending' && currentUser.id === booking.teacher_id && (
        <div className="flex" style={{ gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
          <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => onUpdateStatus(booking.id, 'accepted')}>Accept</button>
          <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => onUpdateStatus(booking.id, 'rejected')}>Reject</button>
        </div>
      )}

      {booking.status === 'accepted' && currentUser.id === booking.teacher_id && (
        <button className="btn btn-primary w-full" style={{ marginTop: 'var(--space-4)' }} onClick={() => onUpdateStatus(booking.id, 'completed')}>
          Complete Session
        </button>
      )}

      {booking.status === 'completed' && (
        <button className="btn btn-secondary w-full" style={{ marginTop: 'var(--space-4)' }} onClick={() => onLeaveReview(booking.id)}>
          Leave Review
        </button>
      )}
    </div>
  );
}
