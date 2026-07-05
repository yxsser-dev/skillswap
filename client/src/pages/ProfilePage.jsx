import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axiosClient from '../api/axiosClient';
import Avatar from '../components/Avatar';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Please choose a JPEG, PNG, or WebP image.', 'warning');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showToast('Image must be under 3MB.', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    try {
      const { data } = await axiosClient.post('/users/me/avatar', formData);
      updateUser(data);
      showToast('Profile photo updated.', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not upload photo.', 'error');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await axiosClient.patch('/users/me', { username, bio });
      updateUser(data);
      showToast('Profile updated.', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <h3 style={{ marginBottom: 'var(--space-5)' }}>My Profile</h3>

      <div className="card-glass" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
          <div style={{ position: 'relative' }}>
            <Avatar username={user.username} src={user.profile_picture_url} size="xl" />
            <button
              className="btn btn-sm btn-primary"
              style={{ position: 'absolute', bottom: -8, right: -8, borderRadius: 'var(--radius-full)', padding: '0.35rem 0.6rem' }}
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
              type="button"
            >
              {uploadingAvatar ? '…' : '✎'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p style={{ fontWeight: 'var(--font-weight-semibold)' }}>{user.username}</p>
            <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>{user.email}</p>
            {user.created_at && (
              <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-1)' }}>
                Member since {new Date(user.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="card-glass">
        <h4 style={{ marginBottom: 'var(--space-4)' }}>Edit Details</h4>
        <form onSubmit={handleSaveProfile}>
          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="form-label">Username</label>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              maxLength={50}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
            <label className="form-label">Bio</label>
            <textarea
              className="textarea"
              rows="3"
              maxLength={300}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short line about the skills you're into"
            />
          </div>
          <button className="btn btn-primary w-full" disabled={savingProfile}>
            {savingProfile ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
