const STATUS_CONFIG = {
  draft: { bg: 'bg-gray-800 border-gray-700', text: '⚙️ Auction not started', color: 'text-gray-400' },
  live: { bg: 'bg-green-950 border-green-800', text: '🔴 Live', color: 'text-green-400' },
  paused: { bg: 'bg-yellow-950 border-yellow-800', text: '⏸️ Auction Paused', color: 'text-yellow-400' },
  completed: { bg: 'bg-blue-950 border-blue-800', text: '✅ Auction Completed', color: 'text-blue-400' },
};

const AuctionStatusBanner = ({ auction }) => {
  const cfg = STATUS_CONFIG[auction?.status] || STATUS_CONFIG.draft;
  return (
    <div className={`${cfg.bg} border rounded-xl px-4 py-2.5 flex items-center justify-between`}>
      <span className={`${cfg.color} font-semibold text-sm`}>{cfg.text}</span>
      <span className='text-gray-500 text-sm'>{auction?.name}</span>
    </div>
  );
};

export default AuctionStatusBanner;
