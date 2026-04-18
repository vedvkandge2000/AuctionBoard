import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gavel } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { registerTeamOwner } from '../services/registrationService';
import Button from '../components/ui/Button';
import FieldError from '../components/ui/FieldError';
import { validateName, validateEmail, validatePassword, validatePasswordMatch } from '../utils/validation';
import PublicLayout from '../components/layout/PublicLayout';

const RegisterPage = () => {
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
      const data = await registerTeamOwner({ name: form.name, email: form.email, password: form.password });
      setSession(data.token, data.user);
      navigate('/', { replace: true });
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'name',     label: 'Full Name',       type: 'text',     autoComplete: 'name',             placeholder: 'Your name' },
    { key: 'email',    label: 'Email',            type: 'text',     autoComplete: 'email',            placeholder: 'you@example.com' },
    { key: 'password', label: 'Password',         type: 'password', autoComplete: 'new-password',     placeholder: 'Min 8 characters' },
    { key: 'confirm',  label: 'Confirm Password', type: 'password', autoComplete: 'new-password',     placeholder: 'Repeat password' },
  ];

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
            <h1 className='text-2xl font-extrabold' style={{ color: 'var(--color-primary)' }}>
              AuctionBoard
            </h1>
            <p className='text-sm mt-1' style={{ color: 'var(--color-text-muted)' }}>
              Register as Team Owner
            </p>
          </div>

          <div
            className='rounded-2xl p-6'
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h2 className='font-semibold mb-1' style={{ color: 'var(--color-text)' }}>
              Create your account
            </h2>
            <p className='text-xs mb-5' style={{ color: 'var(--color-text-subtle)' }}>
              After registering you can browse and apply to join any open auction.
            </p>
            <form onSubmit={handleSubmit} className='space-y-4'>
              {fields.map(({ key, label, type, autoComplete, placeholder }) => (
                <div key={key}>
                  <label className='block text-sm mb-1.5' style={{ color: 'var(--color-text-muted)' }}>
                    {label}
                  </label>
                  <input
                    type={type}
                    autoComplete={autoComplete}
                    value={form[key]}
                    onChange={(e) => { setForm({ ...form, [key]: e.target.value }); clearError(key); }}
                    className='w-full px-3 py-2.5 text-sm rounded-lg'
                    placeholder={placeholder}
                  />
                  <FieldError message={errors[key]} />
                </div>
              ))}
              <Button type='submit' loading={loading} className='w-full' size='lg'>
                Create Account
              </Button>
            </form>

            <div className='mt-4 space-y-2'>
              <p className='text-center text-xs' style={{ color: 'var(--color-text-subtle)' }}>
                Already have an account?{' '}
                <Link to='/login' className='transition-opacity hover:opacity-70' style={{ color: 'var(--color-accent)' }}>
                  Sign in
                </Link>
              </p>
              <p className='text-center text-xs' style={{ color: 'var(--color-text-subtle)' }}>
                Registering as a player?{' '}
                <Link to='/register/player' className='transition-opacity hover:opacity-70' style={{ color: 'var(--color-accent)' }}>
                  Player registration
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default RegisterPage;
