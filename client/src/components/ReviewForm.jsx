export default function ReviewForm({ reviewForm, setReviewForm, onSubmit }) {
  return (
    <div className="card-glass" style={{ marginTop: 'var(--space-8)', maxWidth: 500 }}>
      <h4 style={{ marginBottom: 'var(--space-4)' }}>Submit Session Review</h4>
      <form onSubmit={onSubmit}>
        <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
          <label className="form-label">Rating</label>
          <select
            className="select"
            value={reviewForm.rating}
            onChange={(e) => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) })}
          >
            <option value={5}>5 Stars ★★★★★</option>
            <option value={4}>4 Stars ★★★★</option>
            <option value={3}>3 Stars ★★★</option>
            <option value={2}>2 Stars ★★</option>
            <option value={1}>1 Star ★</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
          <label className="form-label">Comments</label>
          <textarea
            className="textarea"
            rows="3"
            value={reviewForm.comment}
            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
            required
          />
        </div>
        <button className="btn btn-primary">Submit Review</button>
      </form>
    </div>
  );
}
