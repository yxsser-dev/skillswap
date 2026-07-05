import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', bio: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await register(form);
      showToast(`Account created — welcome, ${user.username}.`, 'success');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create your account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>

      <div className="card-glass animate-fadeInUp" style={{ maxWidth: 420, width: '100%' }}>
        <h3 className="gradient-text" style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>
          Create an Account
        </h3>
        <p className="text-secondary" style={{ marginBottom: 'var(--space-6)' }}>Start teaching and learning with SkillSwap.</p>

        {error && <p className="form-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="form-label">Username</label>
            <input
              type="text"
              className="input"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="form-label">Bio (optional)</label>
            <input
              type="text"
              className="input"
              placeholder="A short line about the skills you're into"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="form-label">Email</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button className="btn btn-primary w-full" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p className="text-secondary" style={{ marginTop: 'var(--space-5)', fontSize: 'var(--font-size-sm)' }}>
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
