import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Gavel } from 'lucide-react';
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
          {/* Brand mark */}
          <div className='text-center mb-8'>
            <div
              className='inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-md'
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <Gavel size={30} color='white' />
            </div>
            <h1 className='text-2xl font-extrabold' style={{ color: 'var(--color-primary)' }}>
              AuctionBoard
            </h1>
            <p className='text-sm mt-1' style={{ color: 'var(--color-text-muted)' }}>
              Player auction platform
            </p>
          </div>

          {/* Card */}
          <div
            className='rounded-2xl p-6'
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h2 className='font-semibold mb-5' style={{ color: 'var(--color-text)' }}>
              Sign in to your account
            </h2>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm mb-1.5' style={{ color: 'var(--color-text-muted)' }}>
                  Email
                </label>
                <input
                  type='text'
                  autoComplete='email'
                  value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); clearError('email'); }}
                  className='w-full px-3 py-2.5 text-sm rounded-lg'
                  placeholder='you@example.com'
                />
                <FieldError message={errors.email} />
              </div>
              <div>
                <div className='flex items-center justify-between mb-1.5'>
                  <label className='text-sm' style={{ color: 'var(--color-text-muted)' }}>
                    Password
                  </label>
                  <Link
                    to='/forgot-password'
                    className='text-xs transition-opacity hover:opacity-70'
                    style={{ color: 'var(--color-accent)' }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  type='password'
                  autoComplete='current-password'
                  value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); clearError('password'); }}
                  className='w-full px-3 py-2.5 text-sm rounded-lg'
                  placeholder='••••••••'
                />
                <FieldError message={errors.password} />
              </div>
              <Button type='submit' loading={loading} className='w-full' size='lg'>
                Sign In
              </Button>
            </form>

            <div
              className='mt-5 pt-4 space-y-2'
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              {[
                { text: 'New team owner?', linkTo: '/register', linkLabel: 'Register here' },
                { text: 'Registering as a player?', linkTo: '/register/player', linkLabel: 'Player registration' },
              ].map(({ text, linkTo, linkLabel }) => (
                <p key={linkTo} className='text-center text-xs' style={{ color: 'var(--color-text-subtle)' }}>
                  {text}{' '}
                  <Link to={linkTo} className='transition-opacity hover:opacity-70' style={{ color: 'var(--color-accent)' }}>
                    {linkLabel}
                  </Link>
                </p>
              ))}
              <p className='text-center text-xs'>
                <Link to='/about' className='transition-opacity hover:opacity-70' style={{ color: 'var(--color-text-subtle)' }}>
                  About AuctionBoard
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default LoginPage;
