import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Badge from '../ui/Badge';

const ROLE_BADGE = {
  admin: 'indigo',
  team_owner: 'green',
  viewer: 'default',
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    addToast('Logged out successfully', 'info');
    navigate('/login');
  };

  return (
    <nav className='border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-40'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-14'>
          <Link to='/' className='flex items-center gap-2'>
            <span className='text-2xl'>🏏</span>
            <span className='font-bold text-white text-lg'>AuctionBoard</span>
          </Link>

          <div className='flex items-center gap-3'>
            {user && (
              <>
                <span className='text-gray-400 text-sm hidden sm:block'>{user.name}</span>
                <Badge variant={ROLE_BADGE[user.role] || 'default'}>
                  {user.role.replace('_', ' ')}
                </Badge>
                <button
                  onClick={handleLogout}
                  className='text-gray-400 hover:text-white text-sm transition-colors'
                >
                  Sign out
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
