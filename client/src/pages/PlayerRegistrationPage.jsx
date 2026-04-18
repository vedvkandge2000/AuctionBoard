import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gavel } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { registerPlayer } from '../services/registrationService';
import Button from '../components/ui/Button';
import FieldError from '../components/ui/FieldError';
import { validateName, validateEmail, validatePassword, validatePasswordMatch } from '../utils/validation';
import PublicLayout from '../components/layout/PublicLayout';

const PlayerRegistrationPage = () => {
  const { addToast } = useToast();
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({ name: null, email: null, password: null, confirm: null });
  const [loading, setLoading] = useState(false);

  const clearError = (field) => setErrors((prev) => ({ ...prev, [field]: null }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {
      name: validateName(form.name),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirm: validatePasswordMatch(form.password, form.confirm),
    };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setLoading(true);
    try {
      const data = await registerPlayer({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      // Registration returns a JWT — store session and go straight to dashboard
      setSession(data.token, data.user);
      navigate('/', { replace: true });
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className='flex items-center justify-center p-4 py-12'>
        <div className='w-full max-w-sm animate-fade-in'>
          <div className='text-center mb-8'>
            <div
              className='inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-md'
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <Gavel size={30} color='white' />
            </div>
            <h1 className='text-2xl font-extrabold' style={{ color: 'var(--color-primary)' }}>AuctionBoard</h1>
            <p className='text-sm mt-1' style={{ color: 'var(--color-text-muted)' }}>Player Registration</p>
          </div>

          <div className='rounded-2xl p-6 shadow-2xl' style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <h2 className='font-semibold mb-1' style={{ color: 'var(--color-text)' }}>Create your player account</h2>
            <p className='text-xs mb-5' style={{ color: 'var(--color-text-subtle)' }}>
              After registering you can discover open auctions and register your playing details for each one.
            </p>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm mb-1.5' style={{ color: 'var(--color-text-muted)' }}>Full Name</label>
                <input
                  type='text'
                  value={form.name}
                  onChange={(e) => { setForm({ ...form, name: e.target.value }); clearError('name'); }}
                  className='w-full rounded-lg px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]'
                  placeholder='Your full name'
                />
                <FieldError message={errors.name} />
              </div>
              <div>
                <label className='block text-sm mb-1.5' style={{ color: 'var(--color-text-muted)' }}>Email</label>
                <input
                  type='text'
                  value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); clearError('email'); }}
                  className='w-full rounded-lg px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]'
                  placeholder='you@example.com'
                />
                <FieldError message={errors.email} />
              </div>
              <div>
                <label className='block text-sm mb-1.5' style={{ color: 'var(--color-text-muted)' }}>Password</label>
                <input
                  type='password'
                  value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); clearError('password'); }}
                  className='w-full rounded-lg px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]'
                  placeholder='Min 8 characters'
                />
                <FieldError message={errors.password} />
              </div>
              <div>
                <label className='block text-sm mb-1.5' style={{ color: 'var(--color-text-muted)' }}>Confirm Password</label>
                <input
                  type='password'
                  value={form.confirm}
                  onChange={(e) => { setForm({ ...form, confirm: e.target.value }); clearError('confirm'); }}
                  className='w-full rounded-lg px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]'
                  placeholder='Repeat password'
                />
                <FieldError message={errors.confirm} />
              </div>
              <Button type='submit' loading={loading} className='w-full' size='lg'>
                Create Player Account
              </Button>
            </form>

            <p className='text-center text-xs mt-4' style={{ color: 'var(--color-text-subtle)' }}>
              Team owner?{' '}
              <Link to='/register' style={{ color: 'var(--color-accent)' }} className='hover:opacity-80'>Team owner registration</Link>
            </p>
            <p className='text-center text-xs mt-2' style={{ color: 'var(--color-text-subtle)' }}>
              Already have an account?{' '}
              <Link to='/login' style={{ color: 'var(--color-accent)' }} className='hover:opacity-80'>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default PlayerRegistrationPage;
