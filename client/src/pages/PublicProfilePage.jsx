import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar';
import ActivityTimeline from '../components/ActivityTimeline';
import ReviewsList from '../components/ReviewsList';
import { SkeletonCard } from '../components/Skeleton';

export default function PublicProfilePage() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    (async () => {
      try {
        const [profileRes, activityRes, reviewsRes] = await Promise.all([
          axiosClient.get(`/users/${id}`),
          axiosClient.get(`/users/${id}/activity`),
          axiosClient.get(`/reviews/user/${id}`)
        ]);
        if (cancelled) return;
        setProfile(profileRes.data);
        setActivity(activityRes.data || []);
        setReviews(reviewsRes.data || []);
      } catch (e) {
        if (cancelled) return;
        if (e.response?.status === 404) {
          setNotFound(true);
        } else {
          showToast('Could not load this profile.', 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
   
  }, [id]);

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <SkeletonCard />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔍</div>
        <div className="empty-state-title">User not found</div>
        <p className="empty-state-text">This profile may not exist, or the account has been suspended.</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 'var(--space-4)', display: 'inline-block' }}>
          Back to Listings
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div className="card-glass" style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'center' }}>
        <Avatar username={profile.username} src={profile.profile_picture_url} size="xl" />
        <div style={{ flex: 1 }}>
          <h3 style={{ marginBottom: 'var(--space-1)' }}>{profile.username}</h3>
          <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
            {profile.bio || 'This user hasn\'t written a bio yet.'}
          </p>
          <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-2)' }}>
            Member since {new Date(profile.created_at).toLocaleDateString()} · {profile.active_listings_count} active listing{profile.active_listings_count === 1 ? '' : 's'}
          </p>
        </div>
        <div className="score-circle" title={`${profile.avg_rating} average rating`}>
          {profile.avg_rating || '—'}
        </div>
      </div>

      <div className="card-glass">
        <h4 style={{ marginBottom: 'var(--space-4)' }}>Recent Activity</h4>
        <ActivityTimeline items={activity} />
      </div>

      <div className="card-glass">
        <h4 style={{ marginBottom: 'var(--space-4)' }}>
          Reviews {profile.review_count > 0 && <span className="text-muted">({profile.review_count})</span>}
        </h4>
        <ReviewsList reviews={reviews} />
      </div>
    </div>
  );
}
