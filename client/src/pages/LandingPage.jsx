import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Gavel,
  Zap,
  Gamepad2,
  Wallet,
  ShieldCheck,
  RotateCcw,
  FileSpreadsheet,
  ArrowRight,
  Mail,
  Target,
  Radio,
  ClipboardCheck,
} from 'lucide-react';
import PublicLayout from '../components/layout/PublicLayout';

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'admin@auctionboard.io';

const RevealSection = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

const SPORTS = [
  { icon: '🏏', label: 'Cricket' },
  { icon: '🏸', label: 'Badminton' },
  { icon: '⚽', label: 'Football' },
  { icon: '🏀', label: 'Basketball' },
  { icon: '🎾', label: 'Tennis' },
];

const FEATURES = [
  { Icon: Zap,             title: 'Real-time Bidding',    desc: 'Bids appear instantly for all teams via Socket.io. No refreshing, no lag.',        color: '#2563eb' },
  { Icon: Gamepad2,        title: 'Sport Templates',      desc: 'Built-in templates for cricket, badminton, football and more. Fully customizable.', color: '#7c3aed' },
  { Icon: Wallet,          title: 'Budget Tracking',      desc: 'Live purse tracking for every team. Visual alerts when budgets run low.',            color: '#059669' },
  { Icon: ShieldCheck,     title: 'Role-Based Access',    desc: 'Separate admin, team owner, and viewer roles. Each sees exactly what they need.',   color: '#0891b2' },
  { Icon: RotateCcw,       title: 'RTM Cards',            desc: 'Right-to-match mechanics built in. Teams can retain key players before the hammer.', color: '#d97706' },
  { Icon: FileSpreadsheet, title: 'CSV Import',           desc: 'Bulk upload your entire player list from a spreadsheet in seconds.',                color: '#dc2626' },
];

const STEPS = [
  { n: '1', StepIcon: Target,        title: 'Set Up Your Auction',  desc: 'Choose a sport template, configure your budget rules, and add teams. Takes minutes.' },
  { n: '2', StepIcon: Radio,         title: 'Go Live',              desc: 'Launch the auction. Team owners bid in real time as players are put up one by one.' },
  { n: '3', StepIcon: ClipboardCheck,title: 'Manage Results',       desc: 'RTM windows, sold/unsold decisions, final squad reports — all in one place.' },
];

const LandingPage = () => (
  <PublicLayout>
    {/* ── Hero ── */}
    <section
      className='relative px-4 py-24 text-center overflow-hidden'
      style={{ background: 'var(--gradient-hero)' }}
    >
      {/* Subtle grid overlay */}
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className='relative max-w-3xl mx-auto'>

        {/* Sport icons */}
        <motion.div
          className='flex items-end justify-center gap-3 mb-10'
          initial='hidden'
          animate='visible'
        >
          {SPORTS.map(({ icon, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 + 0.05, type: 'spring', stiffness: 300, damping: 20 }}
              className='flex flex-col items-center gap-1.5'
            >
              <div
                className='w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-md'
                style={{ backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-md)' }}
              >
                {icon}
              </div>
              <span className='text-xs hidden sm:block' style={{ color: 'var(--color-text-subtle)' }}>{label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* LIVE pill badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 20 }}
          className='inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5'
          style={{
            backgroundColor: 'var(--color-success-bg)',
            color: 'var(--color-success-text)',
            border: '1px solid var(--color-success)',
          }}
        >
          <span className='w-1.5 h-1.5 rounded-full bg-current animate-pulse-dot' />
          Multi-sport · Real-time · Built for leagues
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className='text-4xl sm:text-5xl font-extrabold leading-tight mb-4'
          style={{ color: 'var(--color-text)' }}
        >
          Run Live Player Auctions,
          <br className='hidden sm:block' />
          <span style={{ color: 'var(--color-accent)' }}> Instantly</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className='text-lg mb-10 max-w-xl mx-auto'
          style={{ color: 'var(--color-text-muted)' }}
        >
          The all-in-one auction platform for sports leagues. Real-time bidding, team budget tracking,
          and squad management — in one place.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className='flex flex-col sm:flex-row items-center justify-center gap-4'
        >
          <motion.a
            href={`mailto:${CONTACT_EMAIL}?subject=AuctionBoard Admin Access Request`}
            whileHover={{ scale: 1.03, boxShadow: '0 12px 28px rgba(37,99,235,0.4)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className='inline-flex items-center gap-2 font-semibold px-10 py-3.5 rounded-xl text-sm'
            style={{
              backgroundColor: 'var(--color-accent)',
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
            }}
          >
            Get Admin Access <ArrowRight size={16} />
          </motion.a>
          <Link
            to='/login'
            className='inline-flex items-center gap-2 font-medium px-8 py-3 rounded-xl text-sm transition-opacity hover:opacity-70'
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            Sign In
          </Link>
        </motion.div>
      </div>
    </section>

    {/* ── How It Works ── */}
    <section className='px-4 py-20' style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className='max-w-5xl mx-auto'>
        <RevealSection>
          <h2 className='text-2xl font-bold text-center mb-12' style={{ color: 'var(--color-text)' }}>
            How It Works
          </h2>
        </RevealSection>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
          {STEPS.map(({ n, StepIcon, title, desc }, i) => (
            <RevealSection key={n} delay={i * 0.1}>
              <div
                className='rounded-2xl p-6 h-full'
                style={{
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div className='flex items-center gap-3 mb-4'>
                  <span
                    className='inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold flex-shrink-0'
                    style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
                  >
                    {n}
                  </span>
                  <StepIcon size={18} style={{ color: 'var(--color-accent)' }} />
                </div>
                <h3 className='font-semibold mb-2' style={{ color: 'var(--color-text)' }}>{title}</h3>
                <p className='text-sm leading-relaxed' style={{ color: 'var(--color-text-muted)' }}>{desc}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>

    {/* ── Features ── */}
    <section className='px-4 py-20' style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className='max-w-5xl mx-auto'>
        <RevealSection>
          <h2 className='text-2xl font-bold text-center mb-12' style={{ color: 'var(--color-text)' }}>
            Everything You Need
          </h2>
        </RevealSection>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
          {FEATURES.map(({ Icon, title, desc, color }, i) => (
            <RevealSection key={title} delay={i * 0.07}>
              <motion.div
                whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className='rounded-2xl p-5 h-full'
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div
                  className='inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3'
                  style={{ backgroundColor: `${color}18` }}
                >
                  <Icon size={20} style={{ color }} />
                </div>
                <h3 className='font-semibold mb-1.5 text-sm' style={{ color: 'var(--color-text)' }}>{title}</h3>
                <p className='text-xs leading-relaxed' style={{ color: 'var(--color-text-muted)' }}>{desc}</p>
              </motion.div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>

    {/* ── CTA ── */}
    <section className='px-4 py-20' style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className='max-w-xl mx-auto'>
        <RevealSection>
          <div
            className='rounded-2xl p-8 text-center'
            style={{
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div
              className='inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5'
              style={{ backgroundColor: 'var(--color-accent-muted)' }}
            >
              <Mail size={28} style={{ color: 'var(--color-accent)' }} />
            </div>
            <h2 className='font-bold text-xl mb-3' style={{ color: 'var(--color-text)' }}>
              Ready to run your auction?
            </h2>
            <p className='text-sm mb-6 leading-relaxed' style={{ color: 'var(--color-text-muted)' }}>
              Admin accounts are invitation-only. Email us and we'll create your account and send
              you credentials.
            </p>
            <motion.a
              href={`mailto:${CONTACT_EMAIL}?subject=AuctionBoard Admin Access Request`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className='inline-flex items-center gap-2 font-semibold px-6 py-2.5 rounded-xl text-sm'
              style={{ backgroundColor: 'var(--color-accent)', color: '#ffffff' }}
            >
              Request Access — {CONTACT_EMAIL}
            </motion.a>
          </div>
        </RevealSection>
      </div>
    </section>
  </PublicLayout>
);

export default LandingPage;
