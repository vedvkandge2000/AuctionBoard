import { Link } from 'react-router-dom';
import PublicLayout from '../components/layout/PublicLayout';

const Section = ({ title, children }) => (
  <div className='mb-6'>
    <h2 className='font-semibold text-base mb-2' style={{ color: 'var(--color-text)' }}>{title}</h2>
    <p className='text-sm leading-relaxed' style={{ color: 'var(--color-text-muted)' }}>{children}</p>
  </div>
);

const TermsPage = () => (
  <PublicLayout>
    <div className='flex justify-center px-4 py-12'>
      <div className='w-full max-w-2xl animate-fade-in'>
        <div className='text-center mb-8'>
          <h1 className='text-2xl font-bold' style={{ color: 'var(--color-text)' }}>Terms of Use</h1>
          <p className='text-xs mt-2' style={{ color: 'var(--color-text-subtle)' }}>Last updated: 2025</p>
        </div>

        <div
          className='rounded-2xl p-6'
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <Section title='1. Acceptance of Terms'>
            By accessing or using AuctionBoard, you agree to be bound by these Terms of Use. If you do not agree, please do not use the platform.
          </Section>
          <Section title='2. Use of the Platform'>
            AuctionBoard is provided for the purpose of running player auctions for sports leagues. You agree to use it only for lawful purposes and in accordance with these terms. You must not misuse the platform, interfere with its operation, or attempt to gain unauthorised access.
          </Section>
          <Section title='3. Accounts'>
            You are responsible for maintaining the confidentiality of your account credentials. All actions taken under your account are your responsibility. Team owner accounts require admin approval before access is granted.
          </Section>
          <Section title='4. Intellectual Property'>
            All content, branding, and software on AuctionBoard is the property of AuctionBoard and its operators. You may not copy, reproduce, or distribute any part of the platform without written permission.
          </Section>
          <Section title='5. Limitation of Liability'>
            AuctionBoard is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform.
          </Section>
          <Section title='6. Changes to Terms'>
            We reserve the right to update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.
          </Section>
          <Section title='7. Contact'>
            For questions about these terms, please contact us via the email listed on the About page.
          </Section>
        </div>

        <div className='text-center mt-6 flex items-center justify-center gap-4'>
          {[{ to: '/about', label: 'About' }, { to: '/privacy', label: 'Privacy Policy' }].map(({ to, label }) => (
            <Link key={to} to={to} className='text-xs transition-opacity hover:opacity-70' style={{ color: 'var(--color-text-muted)' }}>
              {label}
            </Link>
          ))}
          <Link to='/login' className='text-xs transition-opacity hover:opacity-70' style={{ color: 'var(--color-accent)' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  </PublicLayout>
);

export default TermsPage;
