import { Link, useNavigate } from 'react-router-dom';
import { Gavel, Sun, Moon, LogOut, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import Badge from '../ui/Badge';

const ROLE_BADGE = {
  admin: 'indigo',
  team_owner: 'green',
  viewer: 'default',
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    addToast('Logged out successfully', 'info');
    navigate('/login');
  };

  return (
    <nav
      className='sticky top-0 z-40 backdrop-blur-sm'
      style={{
        backgroundColor: 'var(--color-navbar-bg)',
        borderBottom: '1px solid var(--color-navbar-border)',
      }}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-14'>
          <Link to='/' className='flex items-center gap-2.5'>
            <div
              className='flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0'
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <Gavel size={16} color='white' />
            </div>
            <span className='font-extrabold text-lg' style={{ color: 'var(--color-primary)' }}>
              AuctionBoard
            </span>
          </Link>

          <div className='flex items-center gap-3'>
            {/* Dark mode toggle */}
            <motion.button
              onClick={toggle}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className='p-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]'
              style={{ color: 'var(--color-text-muted)' }}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </motion.button>

            {user && (
              <>
                <Link
                  to='/profile'
                  className='hidden sm:flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70'
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <User size={14} />
                  {user.name}
                </Link>
                <Badge variant={ROLE_BADGE[user.role] || 'default'}>
                  {user.role.replace('_', ' ')}
                </Badge>
                <button
                  onClick={handleLogout}
                  className='flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70 focus-visible:outline-none'
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <LogOut size={14} />
                  <span className='hidden sm:inline'>Sign out</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
