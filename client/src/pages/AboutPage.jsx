import { Link } from 'react-router-dom';
import PublicLayout from '../components/layout/PublicLayout';

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'admin@auctionboard.io';

const AboutPage = () => (
  <PublicLayout>
  <div className='flex justify-center px-4 py-12'>
    <div className='w-full max-w-2xl animate-fade-in'>
      <div className='text-center mb-8'>
        <div className='text-6xl mb-3'>🏏</div>
        <h1 className='text-3xl font-bold text-white'>AuctionBoard</h1>
        <p className='text-gray-400 text-sm mt-2'>Real-time player auction platform</p>
      </div>

      <div className='space-y-6'>
        {/* What it does */}
        <div className='bg-gray-900 border border-gray-800 rounded-2xl p-6'>
          <h2 className='text-white font-semibold text-lg mb-3'>What is AuctionBoard?</h2>
          <p className='text-gray-400 text-sm leading-relaxed'>
            AuctionBoard is a real-time player auction platform built for sports leagues. Admins run live auctions where
            team owners compete to build their squads by bidding on players in real time. It supports multiple sports
            including cricket and badminton, with configurable squad rules, bid increment tiers, and overseas player caps.
          </p>
        </div>

        {/* How to get started */}
        <div className='bg-gray-900 border border-gray-800 rounded-2xl p-6'>
          <h2 className='text-white font-semibold text-lg mb-4'>How to get started</h2>
          <ol className='space-y-4'>
            {[
              { step: '1', title: 'Register as a Team Owner', desc: 'Create your account on the registration page. Your account will be reviewed by the league admin.' },
              { step: '2', title: 'Wait for Approval', desc: 'The admin approves team owner accounts before login is enabled. You\'ll be notified via the email you registered with.' },
              { step: '3', title: 'Join an Auction', desc: 'Once approved, log in to see active auctions. Join the live auction room to bid on players and build your squad in real time.' },
            ].map(({ step, title, desc }) => (
              <li key={step} className='flex gap-4'>
                <span className='flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center'>
                  {step}
                </span>
                <div>
                  <p className='text-white text-sm font-medium'>{title}</p>
                  <p className='text-gray-400 text-sm mt-0.5'>{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Admin access */}
        <div className='bg-gray-900 border border-gray-800 rounded-2xl p-6'>
          <h2 className='text-white font-semibold text-lg mb-3'>Need admin access?</h2>
          <p className='text-gray-400 text-sm leading-relaxed'>
            Admin accounts are not self-service. To request admin access for your league, email us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className='text-indigo-400 hover:text-indigo-300 transition-colors'>
              {CONTACT_EMAIL}
            </a>{' '}
            with your league name and contact details.
          </p>
        </div>
      </div>

      <div className='text-center mt-8 space-y-2'>
        <div>
          <Link to='/login' className='text-indigo-400 hover:text-indigo-300 text-sm transition-colors'>
            Sign in to your account →
          </Link>
        </div>
        <div className='flex items-center justify-center gap-4'>
          <Link to='/terms' className='text-gray-500 hover:text-gray-400 text-xs transition-colors'>Terms of Use</Link>
          <Link to='/privacy' className='text-gray-500 hover:text-gray-400 text-xs transition-colors'>Privacy Policy</Link>
        </div>
      </div>
    </div>
  </div>
  </PublicLayout>
);

export default AboutPage;
