import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [token, setToken] = useState(localStorage.getItem('accessToken') || '');
  const [view, setView] = useState('listings'); // listings, dashboard, bookings, admin
  const [listings, setListings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [skills, setSkills] = useState([]);
  const [stats, setStats] = useState(null);

  // Form states
  const [authForm, setAuthForm] = useState({ email: '', password: '', username: '', bio: '', isRegister: false });
  const [listingForm, setListingForm] = useState({ skill_id: '', type: 'offering', description: '', proficiency_level: 'beginner', days: [], times: [] });
  const [bookingDate, setBookingDate] = useState('');
  const [reviewForm, setReviewForm] = useState({ booking_id: '', rating: 5, comment: '' });

  useEffect(() => {
    fetchListings();
    fetchSkills();
    if (token) {
      fetchMatches();
      fetchBookings();
    }
  }, [token]);

  useEffect(() => {
    if (token && user?.role === 'admin' && view === 'admin') {
      fetchAdminStats();
    }
  }, [token, user, view]);

  const fetchListings = async () => {
    try {
      const res = await fetch(`${API_BASE}/listings`);
      const data = await res.json();
      if (Array.isArray(data)) setListings(data);
    } catch (e) { console.error(e); }
  };

  const fetchSkills = async () => {
    try {
      const res = await fetch(`${API_BASE}/skills`);
      const data = await res.json();
      if (Array.isArray(data)) setSkills(data);
    } catch (e) { console.error(e); }
  };

  const fetchMatches = async () => {
    try {
      const res = await fetch(`${API_BASE}/listings/matches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setMatches(data);
    } catch (e) { console.error(e); }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setBookings(data);
    } catch (e) { console.error(e); }
  };

  const fetchAdminStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data);
    } catch (e) { console.error(e); }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const url = `${API_BASE}/auth/${authForm.isRegister ? 'register' : 'login'}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.accessToken);
      setUser(data.user);
      setView('listings');
    } catch (e) { console.error(e);  
      alert("Network Error: Could not connect to the backend server. Make sure your server is running on port 5000.");  }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setView('listings');
  };

  const createListingSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        skill_id: parseInt(listingForm.skill_id),
        type: listingForm.type,
        description: listingForm.description,
        proficiency_level: listingForm.proficiency_level,
        availability: { days: listingForm.days, times: listingForm.times }
      };

      const res = await fetch(`${API_BASE}/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert('Listing posted successfully.');
        fetchListings();
        fetchMatches();
      }
    } catch (e) { console.error(e); }
  };

  const handleBooking = async (listing) => {
    if (!bookingDate) {
      alert('Select a valid session date & time.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          listing_id: listing.id,
          teacher_id: listing.user_id,
          session_time: bookingDate
        })
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert('Swap booking requested.');
        fetchBookings();
      }
    } catch (e) { console.error(e); }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchBookings();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (e) { console.error(e); }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewForm)
      });
      if (res.ok) {
        alert('Review left successfully');
        setReviewForm({ booking_id: '', rating: 5, comment: '' });
        fetchBookings();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <nav className="navbar">
        <h2>🔄 SkillSwap</h2>
        <div>
          <button className="tab-btn" onClick={() => setView('listings')}>Listings Market</button>
          {token && <button className="tab-btn" onClick={() => setView('dashboard')}>AI Partner Match</button>}
          {token && <button className="tab-btn" onClick={() => setView('bookings')}>My Bookings & Swaps</button>}
          {token && user?.role === 'admin' && <button className="tab-btn" onClick={() => setView('admin')}>Admin</button>}
          {token ? (
            <button style={{ marginLeft: 20 }} onClick={handleLogout}>Logout ({user.username})</button>
          ) : (
            <button style={{ marginLeft: 20 }} onClick={() => setView('auth')}>Login / Register</button>
          )}
        </div>
      </nav>

      <div className="container">
        {view === 'auth' && (
          <div className="glass-panel" style={{ maxWidth: 400, margin: '0 auto' }}>
            <h3>{authForm.isRegister ? 'Create an Account' : 'Welcome Back'}</h3>
            <form onSubmit={handleAuthSubmit}>
              {authForm.isRegister && (
                <>
                  <label>Username</label>
                  <input type="text" value={authForm.username} onChange={e => setAuthForm({ ...authForm, username: e.target.value })} required />
                  <label>Bio</label>
                  <input type="text" value={authForm.bio} onChange={e => setAuthForm({ ...authForm, bio: e.target.value })} />
                </>
              )}
              <label>Email</label>
              <input type="email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} required />
              <label>Password</label>
              <input type="password" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} required />
              <button style={{ marginTop: 20, width: '100%' }}>{authForm.isRegister ? 'Register' : 'Login'}</button>
            </form>
            <p style={{ cursor: 'pointer', color: 'var(--accent-blue)', marginTop: 15 }} onClick={() => setAuthForm({ ...authForm, isRegister: !authForm.isRegister })}>
              {authForm.isRegister ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </p>
          </div>
        )}

        {view === 'listings' && (
          <div>
            <div style={{ display: 'flex', gap: 30 }}>
              <div className="glass-panel" style={{ flex: 1 }}>
                <h3>Browse Global Listings</h3>
                <div className="grid-3" style={{ marginTop: 20 }}>
                  {listings.map(l => (
                    <div className="glass-panel card" key={l.id}>
                      <span className="match-badge" style={{ background: l.type === 'offering' ? 'var(--accent-blue)' : 'var(--accent-purple)', color: '#fff' }}>
                        {l.type}
                      </span>
                      <h4>{l.skill_name}</h4>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Level: {l.proficiency_level}</p>
                      <p>{l.description}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Posted by: {l.username}</p>
                      {token && user?.id !== l.user_id && (
                        <div>
                          <input type="datetime-local" onChange={e => setBookingDate(e.target.value)} required />
                          <button style={{ marginTop: 10, width: '100%' }} onClick={() => handleBooking(l)}>Book Swap Session</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {token && (
                <div className="glass-panel" style={{ width: 350 }}>
                  <h3>Create Listing</h3>
                  <form onSubmit={createListingSubmit}>
                    <label>Skill</label>
                    <select onChange={e => setListingForm({ ...listingForm, skill_id: e.target.value })} required>
                      <option value="">Select skill</option>
                      {skills.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
                    </select>

                    <label>Swap Type</label>
                    <select value={listingForm.type} onChange={e => setListingForm({ ...listingForm, type: e.target.value })}>
                      <option value="offering">Offering (Can Teach)</option>
                      <option value="seeking">Seeking (Want to Learn)</option>
                    </select>

                    <label>Description</label>
                    <textarea rows="4" value={listingForm.description} onChange={e => setListingForm({ ...listingForm, description: e.target.value })} required />

                    <label>Proficiency</label>
                    <select value={listingForm.proficiency_level} onChange={e => setListingForm({ ...listingForm, proficiency_level: e.target.value })}>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>

                    <button style={{ marginTop: 20, width: '100%' }}>Post Listing</button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <div>
            <h3>AI-Driven Reciprocal Swap Matches</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Smart match algorithms calculated from listings reciprocity, availability schedules, and global feedback.</p>
            <div className="grid-3" style={{ marginTop: 20 }}>
              {matches.map(m => (
                <div className="glass-panel card" key={m.candidate.id}>
                  <span className="match-badge">Match Score: {m.score}</span>
                  <h4>{m.candidate.username}</h4>
                  <p>{m.candidate.bio}</p>
                  <div>
                    {m.reasons.map((r, idx) => (
                      <span key={idx} className="reason-tag">{r}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'bookings' && (
          <div>
            <h3>My Active Bookings & Sessions</h3>
            <div className="grid-3" style={{ marginTop: 20 }}>
              {bookings.map(b => (
                <div className="glass-panel card" key={b.id}>
                  <h4>{b.skill_name || 'Skill Swap'}</h4>
                  <p>Teacher: {b.teacher_name}</p>
                  <p>Learner: {b.learner_name}</p>
                  <p style={{ fontSize: 13 }}>Scheduled: {new Date(b.session_time).toLocaleString()}</p>
                  <p style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>Status: {b.status}</p>

                  {/* Actions mapping status changes */}
                  {b.status === 'pending' && user.id === b.teacher_id && (
                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                      <button style={{ background: 'var(--accent-green)' }} onClick={() => updateBookingStatus(b.id, 'accepted')}>Accept</button>
                      <button style={{ background: 'red' }} onClick={() => updateBookingStatus(b.id, 'rejected')}>Reject</button>
                    </div>
                  )}

                  {b.status === 'accepted' && user.id === b.teacher_id && (
                    <button style={{ width: '100%', marginTop: 10 }} onClick={() => updateBookingStatus(b.id, 'completed')}>
                      Complete Session
                    </button>
                  )}

                  {b.status === 'completed' && (
                    <button style={{ width: '100%', marginTop: 10, background: 'var(--accent-purple)' }} onClick={() => setReviewForm({ ...reviewForm, booking_id: b.id })}>
                      Leave Review
                    </button>
                  )}
                </div>
              ))}
            </div>

            {reviewForm.booking_id && (
              <div className="glass-panel" style={{ marginTop: 40, maxWidth: 500 }}>
                <h4>Submit Session Review</h4>
                <form onSubmit={handleReviewSubmit}>
                  <label>Rating (1-5)</label>
                  <select value={reviewForm.rating} onChange={e => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) })}>
                    <option value={5}>5 Stars ★★★★★</option>
                    <option value={4}>4 Stars ★★★★</option>
                    <option value={3}>3 Stars ★★★</option>
                    <option value={2}>2 Stars ★★</option>
                    <option value={1}>1 Star ★</option>
                  </select>
                  <label>Comments</label>
                  <textarea rows="3" value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} required />
                  <button style={{ marginTop: 15 }}>Submit Review</button>
                </form>
              </div>
            )}
          </div>
        )}

        {view === 'admin' && stats && (
          <div>
            <h3>Platform System Overview</h3>
            <div className="grid-3" style={{ margin: '20px 0' }}>
              <div className="glass-panel">
                <h2>{stats.totalUsers}</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Users Onboarded</p>
              </div>
              <div className="glass-panel">
                <h2>{stats.activeListings}</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Active Swap Offers</p>
              </div>
              <div className="glass-panel">
                <h2>{stats.totalBookings}</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Matched Swaps Booked</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}