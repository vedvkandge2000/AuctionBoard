import { Link } from 'react-router-dom';
import PublicLayout from '../components/layout/PublicLayout';

const Section = ({ title, children }) => (
  <div className='mb-6'>
    <h2 className='text-white font-semibold text-base mb-2'>{title}</h2>
    <p className='text-gray-400 text-sm leading-relaxed'>{children}</p>
  </div>
);

const PrivacyPage = () => (
  <PublicLayout>
  <div className='flex justify-center px-4 py-12'>
    <div className='w-full max-w-2xl animate-fade-in'>
      <div className='text-center mb-8'>
        <h1 className='text-2xl font-bold text-white'>Privacy Policy</h1>
        <p className='text-gray-500 text-xs mt-2'>Last updated: 2025</p>
      </div>

      <div className='bg-gray-900 border border-gray-800 rounded-2xl p-6'>
        <Section title='1. Information We Collect'>
          We collect information you provide when registering, including your name, email address, and role within the platform. Player registrations may include additional details such as nationality, sport role, and contact email.
        </Section>
        <Section title='2. How We Use Your Information'>
          Your information is used solely to operate the AuctionBoard platform — managing auctions, team registrations, and player approvals. We do not sell or share your data with third parties for marketing purposes.
        </Section>
        <Section title='3. Data Storage'>
          Your data is stored securely in our database. Passwords are hashed and never stored in plain text. We take reasonable technical measures to protect your information.
        </Section>
        <Section title='4. Cookies and Local Storage'>
          AuctionBoard uses browser local storage to maintain your login session. We do not use third-party tracking cookies.
        </Section>
        <Section title='5. Data Retention'>
          We retain your account data for as long as your account is active. You may request deletion of your account and associated data at any time via your profile settings or by contacting us.
        </Section>
        <Section title='6. Your Rights'>
          You have the right to access, correct, or delete your personal data. To exercise these rights, contact us via the email listed on the About page.
        </Section>
        <Section title='7. Changes to This Policy'>
          We may update this policy periodically. Continued use of the platform after changes constitutes acceptance of the updated policy.
        </Section>
      </div>

      <div className='text-center mt-6 flex items-center justify-center gap-4'>
        <Link to='/about' className='text-gray-400 hover:text-gray-300 text-xs transition-colors'>About</Link>
        <Link to='/terms' className='text-gray-400 hover:text-gray-300 text-xs transition-colors'>Terms of Use</Link>
        <Link to='/login' className='text-indigo-400 hover:text-indigo-300 text-xs transition-colors'>Sign In</Link>
      </div>
    </div>
  </div>
  </PublicLayout>
);

export default PrivacyPage;
