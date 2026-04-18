import { Link } from 'react-router-dom';
import PublicLayout from '../components/layout/PublicLayout';

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'admin@auctionboard.io';

const Card = ({ children }) => (
  <div
    className='rounded-2xl p-6'
    style={{
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
    }}
  >
    {children}
  </div>
);

const AboutPage = () => (
  <PublicLayout>
    <div className='flex justify-center px-4 py-12'>
      <div className='w-full max-w-2xl animate-fade-in'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold' style={{ color: 'var(--color-text)' }}>AuctionBoard</h1>
          <p className='text-sm mt-2' style={{ color: 'var(--color-text-muted)' }}>
            Real-time player auction platform
          </p>
        </div>

        <div className='space-y-6'>
          <Card>
            <h2 className='font-semibold text-lg mb-3' style={{ color: 'var(--color-text)' }}>
              What is AuctionBoard?
            </h2>
            <p className='text-sm leading-relaxed' style={{ color: 'var(--color-text-muted)' }}>
              AuctionBoard is a real-time player auction platform built for sports leagues. Admins run live auctions where
              team owners compete to build their squads by bidding on players in real time. It supports multiple sports
              including cricket and badminton, with configurable squad rules, bid increment tiers, and overseas player caps.
            </p>
          </Card>

          <Card>
            <h2 className='font-semibold text-lg mb-4' style={{ color: 'var(--color-text)' }}>
              How to get started
            </h2>
            <ol className='space-y-4'>
              {[
                { step: '1', title: 'Register as a Team Owner', desc: "Create your account on the registration page. Your account will be reviewed by the league admin." },
                { step: '2', title: 'Wait for Approval', desc: "The admin approves team owner accounts before login is enabled. You'll be notified via the email you registered with." },
                { step: '3', title: 'Join an Auction', desc: "Once approved, log in to see active auctions. Join the live auction room to bid on players and build your squad in real time." },
              ].map(({ step, title, desc }) => (
                <li key={step} className='flex gap-4'>
                  <span
                    className='flex-shrink-0 w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center'
                    style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
                  >
                    {step}
                  </span>
                  <div>
                    <p className='text-sm font-medium' style={{ color: 'var(--color-text)' }}>{title}</p>
                    <p className='text-sm mt-0.5' style={{ color: 'var(--color-text-muted)' }}>{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <h2 className='font-semibold text-lg mb-3' style={{ color: 'var(--color-text)' }}>
              Need admin access?
            </h2>
            <p className='text-sm leading-relaxed' style={{ color: 'var(--color-text-muted)' }}>
              Admin accounts are not self-service. To request admin access for your league, email us at{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className='transition-opacity hover:opacity-70'
                style={{ color: 'var(--color-accent)' }}
              >
                {CONTACT_EMAIL}
              </a>{' '}
              with your league name and contact details.
            </p>
          </Card>
        </div>

        <div className='text-center mt-8 space-y-2'>
          <div>
            <Link
              to='/login'
              className='text-sm transition-opacity hover:opacity-70'
              style={{ color: 'var(--color-accent)' }}
            >
              Sign in to your account →
            </Link>
          </div>
          <div className='flex items-center justify-center gap-4'>
            {[{ to: '/terms', label: 'Terms of Use' }, { to: '/privacy', label: 'Privacy Policy' }].map(({ to, label }) => (
              <Link key={to} to={to} className='text-xs transition-opacity hover:opacity-70' style={{ color: 'var(--color-text-subtle)' }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  </PublicLayout>
);

export default AboutPage;
