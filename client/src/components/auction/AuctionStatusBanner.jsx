import { Radio, PauseCircle, Clock, CheckCircle2 } from 'lucide-react';

const STATUS_CONFIG = {
  draft: {
    bg: 'var(--color-surface-sunken)',
    border: 'var(--color-border)',
    text: 'Auction not started',
    color: 'var(--color-text-muted)',
    Icon: Clock,
  },
  live: {
    bg: 'var(--color-success-bg)',
    border: 'var(--color-success)',
    text: 'Live',
    color: 'var(--color-success-text)',
    Icon: Radio,
    pulse: true,
  },
  paused: {
    bg: 'var(--color-warning-bg)',
    border: 'var(--color-warning)',
    text: 'Auction Paused',
    color: 'var(--color-warning-text)',
    Icon: PauseCircle,
  },
  completed: {
    bg: 'var(--color-accent-muted)',
    border: 'var(--color-accent)',
    text: 'Auction Completed',
    color: 'var(--color-accent)',
    Icon: CheckCircle2,
  },
};

const AuctionStatusBanner = ({ auction }) => {
  const cfg = STATUS_CONFIG[auction?.status] || STATUS_CONFIG.draft;
  const { Icon } = cfg;

  return (
    <div
      className='px-4 py-2.5 rounded-xl flex items-center justify-between'
      style={{
        backgroundColor: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <div className='flex items-center gap-2'>
        {cfg.pulse ? (
          <span className='relative flex items-center'>
            <span
              className='animate-pulse-dot w-2 h-2 rounded-full inline-block mr-1'
              style={{ backgroundColor: cfg.color }}
            />
            <Icon size={14} style={{ color: cfg.color }} />
          </span>
        ) : (
          <Icon size={14} style={{ color: cfg.color }} />
        )}
        <span className='font-semibold text-sm' style={{ color: cfg.color }}>
          {cfg.text}
        </span>
      </div>
      <span className='text-sm' style={{ color: 'var(--color-text-muted)' }}>
        {auction?.name}
      </span>
    </div>
  );
};

export default AuctionStatusBanner;
