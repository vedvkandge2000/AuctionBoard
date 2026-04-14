import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PlayerRegistrationPage from './pages/PlayerRegistrationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AboutPage from './pages/AboutPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import AuctionRoomPage from './pages/AuctionRoomPage';
import PlayersPage from './pages/PlayersPage';
import TeamsPage from './pages/TeamsPage';
import AuctionConfigPage from './pages/AuctionConfigPage';
import AdminApprovalsPage from './pages/AdminApprovalsPage';
import MySquadPage from './pages/MySquadPage';
import SportTemplatesPage from './pages/SportTemplatesPage';
import ProfilePage from './pages/ProfilePage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to='/login' replace />;
};

// Root shows the app when authenticated, landing page when not
const RootRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AppShell /> : <LandingPage />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public routes */}
            <Route path='/login' element={<LoginPage />} />
            <Route path='/register' element={<RegisterPage />} />
            <Route path='/register/player' element={<PlayerRegistrationPage />} />
            <Route path='/forgot-password' element={<ForgotPasswordPage />} />
            <Route path='/reset-password/:token' element={<ResetPasswordPage />} />
            <Route path='/about' element={<AboutPage />} />
            <Route path='/terms' element={<TermsPage />} />
            <Route path='/privacy' element={<PrivacyPage />} />

            {/* Root + protected app routes */}
            <Route path='/' element={<RootRoute />}>
              <Route index element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
              <Route path='profile' element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
              <Route path='admin/approvals' element={<PrivateRoute><AdminApprovalsPage /></PrivateRoute>} />
              <Route path='admin/sport-templates' element={<PrivateRoute><SportTemplatesPage /></PrivateRoute>} />
              <Route path='auction/:id' element={<PrivateRoute><AuctionRoomPage /></PrivateRoute>} />
              <Route path='auction/:id/players' element={<PrivateRoute><PlayersPage /></PrivateRoute>} />
              <Route path='auction/:id/teams' element={<PrivateRoute><TeamsPage /></PrivateRoute>} />
              <Route path='auction/:id/my-squad' element={<PrivateRoute><MySquadPage /></PrivateRoute>} />
              <Route path='auction/:id/config' element={<PrivateRoute><AuctionConfigPage /></PrivateRoute>} />
            </Route>
            <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
