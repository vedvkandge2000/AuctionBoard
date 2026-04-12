import { formatCurrency } from '../../utils/formatCurrency';

const BidHistory = ({ history = [], auction }) => {
  const symbol = auction?.currencySymbol || '₹';
  const unit = auction?.currencyUnit || 'lakh';

  if (history.length === 0) {
    return (
      <div className='bg-gray-900 rounded-2xl border border-gray-700 p-4'>
        <h3 className='text-sm font-medium text-gray-400 mb-2'>Bid History</h3>
        <p className='text-gray-600 text-sm text-center py-4'>No bids yet</p>
      </div>
    );
  }

  return (
    <div className='bg-gray-900 rounded-2xl border border-gray-700 p-4'>
      <h3 className='text-sm font-medium text-gray-400 mb-3'>Bid History</h3>
      <ul className='space-y-2 max-h-48 overflow-y-auto'>
        {history.map((bid, i) => (
          <li
            key={i}
            className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg ${
              i === 0 ? 'bg-indigo-900/50 border border-indigo-700' : 'bg-gray-800'
            }`}
          >
            <span className='text-gray-300'>{bid.teamName}</span>
            <span className='font-semibold text-white'>{formatCurrency(bid.amount, symbol, unit)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BidHistory;
