import { Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ListingsPage from './pages/ListingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MatchesPage from './pages/MatchesPage';
import BookingsPage from './pages/BookingsPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import PublicProfilePage from './pages/PublicProfilePage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <div>
      <Navbar />
      <div className="container page-content">
        <Routes>
          <Route path="/" element={<ListingsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/matches"
            element={
              <ProtectedRoute>
                <MatchesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <BookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/users/:id" element={<PublicProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </div>
  );
}
