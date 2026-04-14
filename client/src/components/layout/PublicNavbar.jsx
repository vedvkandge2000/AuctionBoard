import { Link } from 'react-router-dom';

const PublicNavbar = () => (
  <nav className='border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-40'>
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
      <div className='flex items-center justify-between h-14'>
        <Link to='/' className='flex items-center gap-2'>
          <span className='text-2xl'>🏏</span>
          <span className='font-bold text-white text-lg'>AuctionBoard</span>
        </Link>
        <div className='flex items-center gap-3'>
          <Link
            to='/register'
            className='text-gray-400 hover:text-white text-sm transition-colors hidden sm:block'
          >
            Register
          </Link>
          <Link
            to='/login'
            className='bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors'
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  </nav>
);

export default PublicNavbar;
