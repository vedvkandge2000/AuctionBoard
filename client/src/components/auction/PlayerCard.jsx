import { Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Badge from '../ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';

const ROLE_ICONS = {
  Singles: '🏸',
  Doubles: '🤝',
  'All-Rounder': '⚡',
  Batsman: '🏏',
  Bowler: '🎯',
  'Wicket-Keeper': '🧤',
};

const StatPill = ({ label, value }) => (
  <div
    className='rounded-lg px-3 py-2 text-center'
    style={{ backgroundColor: 'var(--color-surface-sunken)' }}
  >
    <div className='text-xs mb-0.5' style={{ color: 'var(--color-text-muted)' }}>
      {label}
    </div>
    <div className='font-semibold text-sm' style={{ color: 'var(--color-text)' }}>
      {value}
    </div>
  </div>
);

const PlayerCard = ({ player, auction, soldOverlay }) => {
  if (!player) {
    return (
      <div
        className='flex flex-col items-center justify-center h-64 rounded-2xl border'
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div
          className='flex items-center justify-center w-14 h-14 rounded-full mb-3'
          style={{ backgroundColor: 'var(--color-surface-sunken)' }}
        >
          <Timer size={28} className='animate-pulse-dot' style={{ color: 'var(--color-text-subtle)' }} />
        </div>
        <p className='text-sm' style={{ color: 'var(--color-text-muted)' }}>
          Waiting for next player...
        </p>
      </div>
    );
  }

  const symbol = auction?.currencySymbol || '₹';
  const unit = auction?.currencyUnit || 'lakh';
  const statEntries = Object.entries(player.stats || {}).slice(0, 4);

  return (
    <motion.div
      key={player._id}
      initial={{ opacity: 0, scale: 0.93, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className='rounded-2xl overflow-hidden relative'
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* SOLD / UNSOLD overlay */}
      <AnimatePresence>
        {soldOverlay && (
          <motion.div
            className='absolute inset-0 flex items-center justify-center z-10 rounded-2xl'
            style={{
              backgroundColor: soldOverlay === 'sold'
                ? 'rgba(0,201,107,0.92)'
                : 'rgba(255,59,48,0.92)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.span
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1.15, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 16, delay: 0.08 }}
              style={{
                color: '#ffffff',
                fontSize: '3.5rem',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                textShadow: '0 2px 12px rgba(0,0,0,0.3)',
              }}
            >
              {soldOverlay === 'sold' ? 'SOLD!' : 'UNSOLD'}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo header */}
      <div className='relative h-52 overflow-hidden' style={{ backgroundColor: 'var(--color-primary)' }}>
        {player.photoUrl ? (
          <img
            src={player.photoUrl}
            alt={player.name}
            className='h-full w-full object-cover'
          />
        ) : (
          <div className='h-full w-full flex items-center justify-center'>
            <span className='text-8xl opacity-70'>
              {ROLE_ICONS[player.role] || (player.gender ? '🏸' : '👤')}
            </span>
          </div>
        )}
        {/* Gradient overlay */}
        <div
          className='absolute inset-0'
          style={{
            background: 'linear-gradient(to bottom, transparent 40%, rgba(0,42,94,0.88) 100%)',
          }}
        />
        {/* Badges top-right */}
        <div className='absolute top-3 right-3 flex flex-col gap-1.5 items-end'>
          {player.category && (
            <span
              className='text-xs font-bold px-2.5 py-1 rounded-full shadow-md'
              style={{
                backgroundColor: 'var(--color-accent)',
                color: '#ffffff',
              }}
            >
              {player.category}
            </span>
          )}
          {player.gender ? (
            <Badge variant={player.gender === 'female' ? 'pink' : 'blue'}>
              {player.gender === 'female' ? '♀ Female' : '♂ Male'}
            </Badge>
          ) : (
            <Badge variant={player.nationality === 'overseas' ? 'orange' : 'indigo'}>
              {player.nationality === 'overseas' ? '🌍 Overseas' : '🏠 Domestic'}
            </Badge>
          )}
        </div>
        {/* Base price bottom-left */}
        <div className='absolute bottom-3 left-4'>
          <div className='text-xs text-white/60'>Base Price</div>
          <div className='text-white font-bold text-sm'>
            {formatCurrency(player.basePrice, symbol, unit)}
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className='p-5'>
        <div className='mb-3'>
          <h2 className='text-xl font-bold' style={{ color: 'var(--color-text)' }}>
            {player.name}
          </h2>
          <p className='text-sm mt-0.5' style={{ color: 'var(--color-text-muted)' }}>
            {ROLE_ICONS[player.role] || '🏸'} {player.role}
            {player.country && ` · ${player.country}`}
          </p>
        </div>

        {statEntries.length > 0 && (
          <div className='grid grid-cols-2 gap-2 mt-3'>
            {statEntries.map(([key, val]) => (
              <StatPill key={key} label={key.replace(/_/g, ' ')} value={val} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PlayerCard;
