import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { registerPlayer } from '../services/registrationService';
import Button from '../components/ui/Button';

const ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];

const PlayerRegistrationPage = () => {
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    role: '',
    nationality: 'domestic',
    gender: '',
    country: '',
    basePrice: '',
    contactEmail: '',
    battingStyle: '',
    bowlingStyle: '',
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const stats = {};
      if (form.battingStyle) stats.battingStyle = form.battingStyle;
      if (form.bowlingStyle) stats.bowlingStyle = form.bowlingStyle;

      await registerPlayer({
        name: form.name,
        role: form.role,
        nationality: form.nationality,
        gender: form.gender,
        country: form.country,
        basePrice: Number(form.basePrice),
        contactEmail: form.contactEmail,
        stats,
      });
      setDone(true);
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  if (done) {
    return (
      <div className='min-h-screen bg-gray-950 flex items-center justify-center p-4'>
        <div className='w-full max-w-sm text-center animate-fade-in'>
          <div className='text-6xl mb-4'>✅</div>
          <h2 className='text-white text-xl font-semibold mb-2'>Registration Submitted!</h2>
          <p className='text-gray-400 text-sm mb-6'>
            Your player registration is pending admin review. If approved, you'll be added to an upcoming auction.
          </p>
          <Link to='/login' className='text-indigo-400 hover:text-indigo-300 text-sm underline'>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-950 flex items-center justify-center p-4'>
      <div className='w-full max-w-lg animate-fade-in'>
        <div className='text-center mb-8'>
          <div className='text-6xl mb-3'>🏏</div>
          <h1 className='text-2xl font-bold text-white'>AuctionBoard</h1>
          <p className='text-gray-400 text-sm mt-1'>Player Registration</p>
        </div>

        <div className='bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl'>
          <h2 className='text-white font-semibold mb-5'>Register for the auction</h2>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='col-span-2'>
                <label className='block text-gray-400 text-sm mb-1.5'>Full Name *</label>
                <input
                  type='text'
                  required
                  value={form.name}
                  onChange={set('name')}
                  className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  placeholder='Your full name'
                />
              </div>

              <div>
                <label className='block text-gray-400 text-sm mb-1.5'>Role *</label>
                <select
                  required
                  value={form.role}
                  onChange={set('role')}
                  className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                >
                  <option value=''>Select role</option>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className='block text-gray-400 text-sm mb-1.5'>Nationality</label>
                <select
                  value={form.nationality}
                  onChange={set('nationality')}
                  className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                >
                  <option value='domestic'>Domestic</option>
                  <option value='overseas'>Overseas</option>
                </select>
              </div>

              <div>
                <label className='block text-gray-400 text-sm mb-1.5'>Gender (optional)</label>
                <select
                  value={form.gender}
                  onChange={set('gender')}
                  className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                >
                  <option value=''>Not specified</option>
                  <option value='male'>Male</option>
                  <option value='female'>Female</option>
                </select>
              </div>

              <div>
                <label className='block text-gray-400 text-sm mb-1.5'>Country</label>
                <input
                  type='text'
                  value={form.country}
                  onChange={set('country')}
                  className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  placeholder='e.g. India'
                />
              </div>

              <div>
                <label className='block text-gray-400 text-sm mb-1.5'>Base Price (₹ lakh) *</label>
                <input
                  type='number'
                  required
                  min={1}
                  value={form.basePrice}
                  onChange={set('basePrice')}
                  className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  placeholder='e.g. 20'
                />
              </div>

              <div>
                <label className='block text-gray-400 text-sm mb-1.5'>Batting Style</label>
                <input
                  type='text'
                  value={form.battingStyle}
                  onChange={set('battingStyle')}
                  className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  placeholder='Right-hand bat'
                />
              </div>

              <div>
                <label className='block text-gray-400 text-sm mb-1.5'>Bowling Style</label>
                <input
                  type='text'
                  value={form.bowlingStyle}
                  onChange={set('bowlingStyle')}
                  className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  placeholder='Right-arm fast'
                />
              </div>

              <div className='col-span-2'>
                <label className='block text-gray-400 text-sm mb-1.5'>Contact Email</label>
                <input
                  type='email'
                  value={form.contactEmail}
                  onChange={set('contactEmail')}
                  className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  placeholder='For auction notifications (optional)'
                />
              </div>
            </div>

            <Button type='submit' loading={loading} className='w-full' size='lg'>
              Submit Registration
            </Button>
          </form>

          <p className='text-center text-gray-500 text-xs mt-4'>
            Team owner?{' '}
            <Link to='/register' className='text-indigo-400 hover:text-indigo-300'>
              Team owner registration
            </Link>
          </p>
          <p className='text-center text-gray-500 text-xs mt-2'>
            Already have an account?{' '}
            <Link to='/login' className='text-indigo-400 hover:text-indigo-300'>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlayerRegistrationPage;
