import { Link } from 'react-router-dom';

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'admin@auctionboard.io';

const Footer = () => (
  <footer
    className='mt-auto'
    style={{
      borderTop: '1px solid var(--color-border)',
      backgroundColor: 'var(--color-surface)',
    }}
  >
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2'>
      <span className='text-xs' style={{ color: 'var(--color-text-subtle)' }}>
        © 2025 AuctionBoard. All rights reserved.
      </span>
      <nav className='flex items-center gap-4'>
        {[
          { to: '/about', label: 'About' },
          { to: '/terms', label: 'Terms of Use' },
          { to: '/privacy', label: 'Privacy Policy' },
        ].map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className='text-xs transition-opacity hover:opacity-70'
            style={{ color: 'var(--color-text-muted)' }}
          >
            {label}
          </Link>
        ))}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className='text-xs transition-opacity hover:opacity-70'
          style={{ color: 'var(--color-text-muted)' }}
        >
          Contact
        </a>
      </nav>
    </div>
  </footer>
);

export default Footer;
