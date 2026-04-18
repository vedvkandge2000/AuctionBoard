import { Link } from 'react-router-dom';
import { Gavel, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const PublicNavbar = () => {
  const { theme, toggle } = useTheme();

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

            <Link
              to='/register'
              className='text-sm transition-opacity hover:opacity-70 hidden sm:block'
              style={{ color: 'var(--color-text-muted)' }}
            >
              Register
            </Link>
            <Link
              to='/login'
              className='text-sm font-medium px-4 py-1.5 rounded-lg transition-opacity hover:opacity-85'
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-text-inverse)',
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;
