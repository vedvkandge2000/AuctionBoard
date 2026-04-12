import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PlayerRegistrationPage from './pages/PlayerRegistrationPage';
import DashboardPage from './pages/DashboardPage';
import AuctionRoomPage from './pages/AuctionRoomPage';
import PlayersPage from './pages/PlayersPage';
import TeamsPage from './pages/TeamsPage';
import AuctionConfigPage from './pages/AuctionConfigPage';
import AdminApprovalsPage from './pages/AdminApprovalsPage';
import MySquadPage from './pages/MySquadPage';
import SportTemplatesPage from './pages/SportTemplatesPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to='/login' replace />;
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

            {/* Protected routes */}
            <Route
              path='/'
              element={<PrivateRoute><AppShell /></PrivateRoute>}
            >
              <Route index element={<DashboardPage />} />
              <Route path='my-squad' element={<MySquadPage />} />
              <Route path='admin/approvals' element={<AdminApprovalsPage />} />
              <Route path='admin/sport-templates' element={<SportTemplatesPage />} />
              <Route path='auction/:id' element={<AuctionRoomPage />} />
              <Route path='auction/:id/players' element={<PlayersPage />} />
              <Route path='auction/:id/teams' element={<TeamsPage />} />
              <Route path='auction/:id/config' element={<AuctionConfigPage />} />
            </Route>
            <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
