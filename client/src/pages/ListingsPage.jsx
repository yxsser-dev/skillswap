import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDialog } from '../context/DialogContext';
import axiosClient from '../api/axiosClient';
import ListingCard from '../components/ListingCard';
import { SkeletonGrid } from '../components/Skeleton';

export default function ListingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { promptText } = useDialog();

  const [listings, setListings] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingDates, setBookingDates] = useState({});
  const [listingForm, setListingForm] = useState({
    skill_id: '', type: 'offering', description: '', proficiency_level: 'beginner', days: [], times: []
  });
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('');
  const [creatingSkill, setCreatingSkill] = useState(false);

  // Search / filter / sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const fetchListings = useCallback(async () => {
    try {
      const { data } = await axiosClient.get('/listings');
      if (Array.isArray(data)) setListings(data);
    } catch (e) {
      showToast('Could not load listings.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchSkills = useCallback(async () => {
    try {
      const { data } = await axiosClient.get('/skills');
      if (Array.isArray(data)) setSkills(data);
    } catch (e) {  }
  }, []);

  useEffect(() => {
    fetchListings();
    fetchSkills();
  }, [fetchListings, fetchSkills]);

  const categories = useMemo(() => {
    const unique = new Set(listings.map((l) => l.skill_category).filter(Boolean));
    return ['all', 'type:offering', 'type:seeking', ...Array.from(unique).sort()];
  }, [listings]);

  const skillCategoryOptions = useMemo(() => {
    return Array.from(new Set(skills.map((s) => s.category).filter(Boolean))).sort();
  }, [skills]);

  const visibleListings = useMemo(() => {
    let result = listings;

    if (activeCategory === 'type:offering') {
      result = result.filter((l) => l.type === 'offering');
    } else if (activeCategory === 'type:seeking') {
      result = result.filter((l) => l.type === 'seeking');
    } else if (activeCategory !== 'all') {
      result = result.filter((l) => l.skill_category === activeCategory);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(
        (l) =>
          l.skill_name?.toLowerCase().includes(term) ||
          l.description?.toLowerCase().includes(term) ||
          l.username?.toLowerCase().includes(term)
      );
    }

    const sorted = [...result];
    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'rating') {
      sorted.sort((a, b) => (b.owner_avg_rating || 0) - (a.owner_avg_rating || 0));
    }
    return sorted;
  }, [listings, activeCategory, searchTerm, sortBy]);

  const handleDateChange = (listingId, value) => {
    setBookingDates((prev) => ({ ...prev, [listingId]: value }));
  };

  const handleBooking = async (listing) => {
    const sessionTime = bookingDates[listing.id];
    if (!sessionTime) {
      showToast('Select a session date & time first.', 'warning');
      return;
    }
    try {
      await axiosClient.post('/bookings', {
        listing_id: listing.id,
        teacher_id: listing.user_id,
        session_time: sessionTime
      });
      showToast('Swap session requested.', 'success');
    } catch (e) {
      showToast(e.response?.data?.error || 'Could not create booking.', 'error');
    }
  };

  const handleReport = async (listing) => {
    const reason = await promptText({
      title: 'Report this listing',
      message: `Reporting "${listing.skill_name}" by ${listing.username}.`,
      placeholder: 'Describe the issue...',
      minLength: 10,
      confirmLabel: 'Submit Report'
    });
    if (reason === null) return;

    try {
      await axiosClient.post('/reports', {
        reported_user_id: listing.user_id,
        listing_id: listing.id,
        reason
      });
      showToast('Report submitted — our moderators will review it.', 'success');
    } catch (e) {
      showToast(e.response?.data?.error || 'Could not submit report.', 'error');
    }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    try {
      let skillId = listingForm.skill_id;

      if (skillId === '__new__') {
        const name = newSkillName.trim();
        const category = newSkillCategory.trim();
        if (!name || !category) {
          showToast('Enter a name and category for the new skill.', 'warning');
          return;
        }
        setCreatingSkill(true);
        const { data: newSkill } = await axiosClient.post('/skills', { name, category });
        setCreatingSkill(false);
        skillId = newSkill.id;
        setSkills((prev) => [...prev, newSkill].sort((a, b) => a.name.localeCompare(b.name)));
      }

      await axiosClient.post('/listings', {
        skill_id: parseInt(skillId),
        type: listingForm.type,
        description: listingForm.description,
        proficiency_level: listingForm.proficiency_level,
        availability: { days: listingForm.days, times: listingForm.times }
      });
      showToast('Listing posted successfully.', 'success');
      setListingForm({ skill_id: '', type: 'offering', description: '', proficiency_level: 'beginner', days: [], times: [] });
      setNewSkillName('');
      setNewSkillCategory('');
      fetchListings();
    } catch (e) {
      setCreatingSkill(false);
      showToast(e.response?.data?.error || 'Could not create listing.', 'error');
    }
  };

  return (
    <div className="listings-layout">
      <div className="listings-main">
        <h3 style={{ marginBottom: 'var(--space-1)' }}>Browse Listings</h3>
        <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
          Skills people are offering to teach, and skills people want to learn.
        </p>

        {categories.length > 1 && (
          <div className="category-chip-row" style={{ marginTop: 'var(--space-5)' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`filter-chip${activeCategory === cat ? ' active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat === 'all' ? 'All Categories' : cat === 'type:offering' ? 'Offering' : cat === 'type:seeking' ? 'Seeking' : cat}
              </button>
            ))}
          </div>
        )}

        <div className="filter-bar">
          <input
            type="text"
            className="input"
            style={{ flex: 1, minWidth: 200 }}
            placeholder="Search by skill, description, or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select className="select" style={{ width: 180 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>

        {loading ? (
          <SkeletonGrid count={6} />
        ) : visibleListings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">No listings match</div>
            <p className="empty-state-text">
              {listings.length === 0
                ? 'Be the first to post a skill you can teach or want to learn.'
                : 'Try a different search term or category.'}
            </p>
          </div>
        ) : (
          <div className="grid-3">
            {visibleListings.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                currentUser={user}
                bookingDate={bookingDates[l.id]}
                onDateChange={handleDateChange}
                onBook={handleBooking}
                onReport={handleReport}
              />
            ))}
          </div>
        )}
      </div>

      {user && (
        <div className="card-glass create-listing-panel">
          <h4 style={{ marginBottom: 'var(--space-4)' }}>Create Listing</h4>
          <form onSubmit={handleCreateListing}>
            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="form-label">Skill</label>
              <select
                className="select"
                value={listingForm.skill_id}
                onChange={(e) => setListingForm({ ...listingForm, skill_id: e.target.value })}
                required
              >
                <option value="">Select skill</option>
                {skills.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
                <option value="__new__">+ Add a new skill…</option>
              </select>
            </div>

            {listingForm.skill_id === '__new__' && (
              <div
                className="form-group"
                style={{
                  marginBottom: 'var(--space-4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-3)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-surface)'
                }}
              >
                <label className="form-label">New Skill Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Watercolor Painting"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  required
                />
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="input"
                  list="skill-category-options"
                  placeholder="e.g. Arts & Crafts"
                  value={newSkillCategory}
                  onChange={(e) => setNewSkillCategory(e.target.value)}
                  required
                />
                <datalist id="skill-category-options">
                  {skillCategoryOptions.map((c) => <option key={c} value={c} />)}
                </datalist>
                <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>
                  This skill will be added to the shared list so anyone can use it going forward.
                </p>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="form-label">Swap Type</label>
              <select
                className="select"
                value={listingForm.type}
                onChange={(e) => setListingForm({ ...listingForm, type: e.target.value })}
              >
                <option value="offering">Offering (Can Teach)</option>
                <option value="seeking">Seeking (Want to Learn)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="form-label">Description</label>
              <textarea
                className="textarea"
                rows="4"
                value={listingForm.description}
                onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
              <label className="form-label">Proficiency</label>
              <select
                className="select"
                value={listingForm.proficiency_level}
                onChange={(e) => setListingForm({ ...listingForm, proficiency_level: e.target.value })}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <button className="btn btn-primary w-full" disabled={creatingSkill}>
              {creatingSkill ? 'Adding skill…' : 'Post Listing'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
