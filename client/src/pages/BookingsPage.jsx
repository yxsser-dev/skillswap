import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axiosClient from '../api/axiosClient';
import BookingCard from '../components/BookingCard';
import ReviewForm from '../components/ReviewForm';
import { SkeletonGrid } from '../components/Skeleton';

export default function BookingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ booking_id: '', rating: 5, comment: '' });

  const fetchBookings = useCallback(async () => {
    try {
      const { data } = await axiosClient.get('/bookings');
      if (Array.isArray(data)) setBookings(data);
    } catch (e) {
      showToast('Could not load your bookings.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await axiosClient.patch(`/bookings/${bookingId}/status`, { status });
      showToast(`Booking marked ${status}.`, 'success');
      fetchBookings();
    } catch (e) {
      showToast(e.response?.data?.error || 'Could not update booking.', 'error');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/reviews', reviewForm);
      showToast('Review submitted, thank you!', 'success');
      setReviewForm({ booking_id: '', rating: 5, comment: '' });
      fetchBookings();
    } catch (e) {
      showToast(e.response?.data?.error || 'Could not submit review.', 'error');
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: 'var(--space-5)' }}>My Bookings & Sessions</h3>

      {loading ? (
        <SkeletonGrid count={4} />
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-title">No bookings yet</div>
          <p className="empty-state-text">Book a swap session from the Listings page to see it here.</p>
        </div>
      ) : (
        <div className="grid-3">
          {bookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              currentUser={user}
              onUpdateStatus={updateBookingStatus}
              onLeaveReview={(bookingId) => setReviewForm({ ...reviewForm, booking_id: bookingId })}
            />
          ))}
        </div>
      )}

      {reviewForm.booking_id && (
        <ReviewForm reviewForm={reviewForm} setReviewForm={setReviewForm} onSubmit={handleReviewSubmit} />
      )}
    </div>
  );
}
