import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../components/layout/PublicLayout';

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'admin@auctionboard.io';

// Adds animate-slide-up when element enters viewport (fires once)
const RevealSection = ({ children, className = '' }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('animate-slide-up');
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`opacity-0 ${className}`} style={{ animationFillMode: 'both' }}>
      {children}
    </div>
  );
};

const FEATURES = [
  { icon: '⚡', title: 'Real-time Bidding', desc: 'Bids appear instantly for all teams via Socket.io. No refreshing, no lag.' },
  { icon: '🎮', title: 'Sport Templates', desc: 'Built-in templates for cricket, badminton, and more. Fully customizable roles and rules.' },
  { icon: '💰', title: 'Budget Tracking', desc: 'Live purse tracking for every team. Visual alerts when budgets run low.' },
  { icon: '🔐', title: 'Role-Based Access', desc: 'Separate admin, team owner, and viewer roles. Each sees exactly what they need.' },
  { icon: '🔄', title: 'RTM Cards', desc: 'Right-to-match mechanics built in. Teams can retain key players before the hammer falls.' },
  { icon: '📋', title: 'CSV Import', desc: 'Bulk upload your entire player list from a spreadsheet in seconds.' },
];

const STEPS = [
  { n: '1', title: 'Set Up Your Auction', desc: 'Choose a sport template, configure your budget rules, and add teams. Takes minutes.' },
  { n: '2', title: 'Go Live', desc: 'Launch the auction. Team owners bid in real time as players are put up one by one.' },
  { n: '3', title: 'Manage Results', desc: 'RTM windows, sold/unsold decisions, final squad reports — all in one place.' },
];

const LandingPage = () => (
  <PublicLayout>
    {/* Hero */}
    <section className='bg-gradient-to-b from-indigo-950 via-gray-950 to-gray-950 px-4 py-24 text-center'>
      <div className='max-w-3xl mx-auto'>
        <div className='text-7xl mb-6'>🏏</div>
        <h1 className='text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4'>
          Run Live Player Auctions,<br className='hidden sm:block' /> Instantly
        </h1>
        <p className='text-gray-400 text-lg mb-10 max-w-xl mx-auto'>
          The all-in-one auction platform for sports leagues. Real-time bidding, team budget tracking, and squad management — in one place.
        </p>
        <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=AuctionBoard Admin Access Request`}
            className='bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-sm'
          >
            Get Admin Access
          </a>
          <Link
            to='/login'
            className='border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-medium px-8 py-3 rounded-xl transition-colors text-sm'
          >
            Sign In
          </Link>
        </div>
      </div>
    </section>

    {/* How It Works */}
    <section className='px-4 py-20'>
      <div className='max-w-5xl mx-auto'>
        <RevealSection>
          <h2 className='text-2xl font-bold text-white text-center mb-12'>How It Works</h2>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className='bg-gray-900 border border-gray-800 rounded-2xl p-6'>
                <span className='inline-flex items-center justify-center w-9 h-9 rounded-full bg-indigo-600 text-white text-sm font-bold mb-4'>
                  {n}
                </span>
                <h3 className='text-white font-semibold mb-2'>{title}</h3>
                <p className='text-gray-400 text-sm leading-relaxed'>{desc}</p>
              </div>
            ))}
          </div>
        </RevealSection>
      </div>
    </section>

    {/* Features */}
    <section className='px-4 py-20 bg-gray-900/40'>
      <div className='max-w-5xl mx-auto'>
        <RevealSection>
          <h2 className='text-2xl font-bold text-white text-center mb-12'>Everything You Need</h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className='bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors'>
                <div className='text-3xl mb-3'>{icon}</div>
                <h3 className='text-white font-semibold mb-1.5 text-sm'>{title}</h3>
                <p className='text-gray-400 text-xs leading-relaxed'>{desc}</p>
              </div>
            ))}
          </div>
        </RevealSection>
      </div>
    </section>

    {/* Get Access */}
    <section className='px-4 py-20'>
      <div className='max-w-xl mx-auto'>
        <RevealSection>
          <div className='bg-gray-900 border border-indigo-900/50 rounded-2xl p-8 text-center'>
            <div className='text-4xl mb-4'>📬</div>
            <h2 className='text-white font-bold text-xl mb-3'>Ready to run your auction?</h2>
            <p className='text-gray-400 text-sm mb-6 leading-relaxed'>
              Admin accounts are invitation-only. Email us and we'll create your account and send you credentials.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=AuctionBoard Admin Access Request`}
              className='inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm'
            >
              Request Access — {CONTACT_EMAIL}
            </a>
          </div>
        </RevealSection>
      </div>
    </section>
  </PublicLayout>
);

export default LandingPage;
