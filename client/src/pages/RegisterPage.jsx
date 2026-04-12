import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { registerTeamOwner } from '../services/registrationService';
import Button from '../components/ui/Button';

const RegisterPage = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      addToast('Passwords do not match', 'error');
      return;
    }
    setLoading(true);
    try {
      await registerTeamOwner({ name: form.name, email: form.email, password: form.password });
      setDone(true);
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className='min-h-screen bg-gray-950 flex items-center justify-center p-4'>
        <div className='w-full max-w-sm text-center animate-fade-in'>
          <div className='text-6xl mb-4'>✅</div>
          <h2 className='text-white text-xl font-semibold mb-2'>Registration Submitted!</h2>
          <p className='text-gray-400 text-sm mb-6'>
            Your team owner account is pending admin approval. You'll be able to log in once approved.
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
      <div className='w-full max-w-sm animate-fade-in'>
        <div className='text-center mb-8'>
          <div className='text-6xl mb-3'>🏏</div>
          <h1 className='text-2xl font-bold text-white'>AuctionBoard</h1>
          <p className='text-gray-400 text-sm mt-1'>Register as Team Owner</p>
        </div>

        <div className='bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl'>
          <h2 className='text-white font-semibold mb-5'>Create your account</h2>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-gray-400 text-sm mb-1.5'>Full Name</label>
              <input
                type='text'
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                placeholder='Your name'
              />
            </div>
            <div>
              <label className='block text-gray-400 text-sm mb-1.5'>Email</label>
              <input
                type='email'
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                placeholder='you@example.com'
              />
            </div>
            <div>
              <label className='block text-gray-400 text-sm mb-1.5'>Password</label>
              <input
                type='password'
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                placeholder='Min 6 characters'
              />
            </div>
            <div>
              <label className='block text-gray-400 text-sm mb-1.5'>Confirm Password</label>
              <input
                type='password'
                required
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                placeholder='Repeat password'
              />
            </div>
            <Button type='submit' loading={loading} className='w-full' size='lg'>
              Submit Registration
            </Button>
          </form>

          <p className='text-center text-gray-500 text-xs mt-4'>
            Already have an account?{' '}
            <Link to='/login' className='text-indigo-400 hover:text-indigo-300'>
              Sign in
            </Link>
          </p>
          <p className='text-center text-gray-500 text-xs mt-2'>
            Registering as a player?{' '}
            <Link to='/register/player' className='text-indigo-400 hover:text-indigo-300'>
              Player registration
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
