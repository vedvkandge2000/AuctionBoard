import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import FieldError from '../components/ui/FieldError';
import { validateEmail } from '../utils/validation';
import PublicLayout from '../components/layout/PublicLayout';

const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: null, password: null });
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  const clearError = (field) => setErrors((prev) => ({ ...prev, [field]: null }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {
      email: validateEmail(form.email),
      password: !form.password ? 'Password is required' : null,
    };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setLoading(true);
    try {
      await login(form.email, form.password);
      addToast('Welcome back!', 'success');
      navigate('/');
    } catch (err) {
      addToast(err.response?.data?.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
    <div className='flex items-center justify-center p-4 py-12'>
      <div className='w-full max-w-sm animate-fade-in'>
        <div className='text-center mb-8'>
          <div className='text-6xl mb-3'>🏏</div>
          <h1 className='text-2xl font-bold text-white'>AuctionBoard</h1>
          <p className='text-gray-400 text-sm mt-1'>Player auction platform</p>
        </div>

        <div className='bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl'>
          <h2 className='text-white font-semibold mb-5'>Sign in to your account</h2>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-gray-400 text-sm mb-1.5'>Email</label>
              <input
                type='text'
                autoComplete='email'
                value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); clearError('email'); }}
                className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                placeholder='you@example.com'
              />
              <FieldError message={errors.email} />
            </div>
            <div>
              <div className='flex items-center justify-between mb-1.5'>
                <label className='text-gray-400 text-sm'>Password</label>
                <Link to='/forgot-password' className='text-xs text-indigo-400 hover:text-indigo-300'>
                  Forgot password?
                </Link>
              </div>
              <input
                type='password'
                autoComplete='current-password'
                value={form.password}
                onChange={(e) => { setForm({ ...form, password: e.target.value }); clearError('password'); }}
                className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                placeholder='••••••••'
              />
              <FieldError message={errors.password} />
            </div>
            <Button type='submit' loading={loading} className='w-full' size='lg'>
              Sign In
            </Button>
          </form>

          <div className='mt-5 pt-4 border-t border-gray-800 space-y-2'>
            <p className='text-center text-gray-500 text-xs'>
              New team owner?{' '}
              <Link to='/register' className='text-indigo-400 hover:text-indigo-300'>Register here</Link>
            </p>
            <p className='text-center text-gray-500 text-xs'>
              Registering as a player?{' '}
              <Link to='/register/player' className='text-indigo-400 hover:text-indigo-300'>Player registration</Link>
            </p>
            <p className='text-center text-gray-500 text-xs'>
              <Link to='/about' className='text-gray-500 hover:text-gray-400'>About AuctionBoard</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    </PublicLayout>
  );
};

export default LoginPage;
