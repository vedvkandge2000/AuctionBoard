import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gavel, Mail } from 'lucide-react';
import { forgotPassword } from '../services/authService';
import Button from '../components/ui/Button';
import FieldError from '../components/ui/FieldError';
import { validateEmail } from '../utils/validation';
import PublicLayout from '../components/layout/PublicLayout';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }
    setLoading(true);
    setFormError(null);
    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Something went wrong. Please try again.');
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
            <h1 className='text-2xl font-extrabold' style={{ color: 'var(--color-primary)' }}>
              AuctionBoard
            </h1>
            <p className='text-sm mt-1' style={{ color: 'var(--color-text-muted)' }}>
              Reset your password
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
            {submitted ? (
              <div className='text-center'>
                <div
                  className='inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4'
                  style={{ backgroundColor: 'var(--color-success-bg)' }}
                >
                  <Mail size={26} style={{ color: 'var(--color-success-text)' }} />
                </div>
                <h2 className='font-semibold mb-2' style={{ color: 'var(--color-text)' }}>
                  Check your inbox
                </h2>
                <p className='text-sm mb-6' style={{ color: 'var(--color-text-muted)' }}>
                  If that email is registered, you'll receive a reset link shortly.
                </p>
                <Link
                  to='/login'
                  className='text-sm underline transition-opacity hover:opacity-70'
                  style={{ color: 'var(--color-accent)' }}
                >
                  Back to Login
                </Link>
              </div>
            ) : (
              <>
                <h2 className='font-semibold mb-2' style={{ color: 'var(--color-text)' }}>
                  Forgot your password?
                </h2>
                <p className='text-sm mb-5' style={{ color: 'var(--color-text-muted)' }}>
                  Enter the email address for your account and we'll send you a reset link.
                </p>
                <form onSubmit={handleSubmit} className='space-y-4'>
                  <div>
                    <label className='block text-sm mb-1.5' style={{ color: 'var(--color-text-muted)' }}>
                      Email address
                    </label>
                    <input
                      type='text'
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                      className='w-full px-3 py-2.5 text-sm rounded-lg'
                      placeholder='you@example.com'
                      autoFocus
                    />
                    <FieldError message={emailError} />
                  </div>
                  {formError && (
                    <p className='text-xs' style={{ color: 'var(--color-danger-text)' }}>{formError}</p>
                  )}
                  <Button type='submit' loading={loading} className='w-full' size='lg'>
                    Send Reset Link
                  </Button>
                </form>
                <p className='text-center text-xs mt-4'>
                  <Link
                    to='/login'
                    className='transition-opacity hover:opacity-70'
                    style={{ color: 'var(--color-accent)' }}
                  >
                    Back to Login
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ForgotPasswordPage;
