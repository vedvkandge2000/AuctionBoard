import { Link } from 'react-router-dom';

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'admin@auctionboard.io';

const Footer = () => (
  <footer className='border-t border-gray-800 bg-gray-950 mt-auto'>
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2'>
      <span className='text-gray-500 text-xs'>© 2025 AuctionBoard. All rights reserved.</span>
      <nav className='flex items-center gap-4'>
        <Link to='/about' className='text-gray-400 hover:text-gray-300 text-xs transition-colors'>About</Link>
        <Link to='/terms' className='text-gray-400 hover:text-gray-300 text-xs transition-colors'>Terms of Use</Link>
        <Link to='/privacy' className='text-gray-400 hover:text-gray-300 text-xs transition-colors'>Privacy Policy</Link>
        <a href={`mailto:${CONTACT_EMAIL}`} className='text-gray-400 hover:text-gray-300 text-xs transition-colors'>Contact</a>
      </nav>
    </div>
  </footer>
);

export default Footer;
