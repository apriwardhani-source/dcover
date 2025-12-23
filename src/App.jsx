import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import MusicPlayer from './components/MusicPlayer';
import Onboarding from './components/Onboarding';

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import AlbumDetail from './pages/AlbumDetail';
import Admin from './pages/Admin';
import SongDetail from './pages/SongDetail';
import Activity from './pages/Activity';

// Layout for authenticated pages
const AuthenticatedLayout = ({ children }) => (
  <div className="min-h-screen relative">
    {/* Background effects */}
    <div className="gradient-mesh" />
    <div className="noise-overlay" />

    <Navbar />
    <main className="md:ml-64 px-4 md:px-8 py-6 min-h-screen relative z-10">
      {children}
    </main>
    <MusicPlayer />
    <Onboarding />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <PlayerProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><AuthenticatedLayout><Home /></AuthenticatedLayout></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute><AuthenticatedLayout><Upload /></AuthenticatedLayout></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><AuthenticatedLayout><Profile /></AuthenticatedLayout></ProtectedRoute>} />
              <Route path="/album/:albumId" element={<ProtectedRoute><AuthenticatedLayout><AlbumDetail /></AuthenticatedLayout></ProtectedRoute>} />
              <Route path="/song/:id" element={<ProtectedRoute><AuthenticatedLayout><SongDetail /></AuthenticatedLayout></ProtectedRoute>} />
              <Route path="/activity" element={<ProtectedRoute><AuthenticatedLayout><Activity /></AuthenticatedLayout></ProtectedRoute>} />
              <Route path="/user/:userId" element={<ProtectedRoute><AuthenticatedLayout><UserProfile /></AuthenticatedLayout></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute adminOnly><AuthenticatedLayout><Admin /></AuthenticatedLayout></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster position="bottom-center" toastOptions={{ style: { background: 'var(--color-surface)', color: 'var(--color-text-primary)', borderRadius: '8px' }, success: { iconTheme: { primary: '#14b8a6', secondary: '#000' } }, error: { iconTheme: { primary: '#ff4444', secondary: '#fff' } } }} />
          </PlayerProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
