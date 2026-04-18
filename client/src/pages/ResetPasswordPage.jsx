import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Gavel, CheckCircle } from 'lucide-react';
import { resetPassword } from '../services/authService';
import Button from '../components/ui/Button';
import FieldError from '../components/ui/FieldError';
import { validatePassword, validatePasswordMatch } from '../utils/validation';
import PublicLayout from '../components/layout/PublicLayout';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({ password: null, confirm: null });
  const [formError, setFormError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const clearError = (field) => setErrors((prev) => ({ ...prev, [field]: null }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {
      password: validatePassword(form.password),
      confirm: validatePasswordMatch(form.password, form.confirm),
    };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setLoading(true);
    setFormError(null);
    try {
      await resetPassword(token, form.password, form.confirm);
      setDone(true);
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
              Set a new password
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
            {done ? (
              <div className='text-center'>
                <div
                  className='inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4'
                  style={{ backgroundColor: 'var(--color-success-bg)' }}
                >
                  <CheckCircle size={26} style={{ color: 'var(--color-success-text)' }} />
                </div>
                <h2 className='font-semibold mb-2' style={{ color: 'var(--color-text)' }}>
                  Password reset!
                </h2>
                <p className='text-sm mb-6' style={{ color: 'var(--color-text-muted)' }}>
                  Your password has been updated. You can now sign in.
                </p>
                <Link
                  to='/login'
                  className='text-sm underline transition-opacity hover:opacity-70'
                  style={{ color: 'var(--color-accent)' }}
                >
                  Go to Login
                </Link>
              </div>
            ) : (
              <>
                <h2 className='font-semibold mb-5' style={{ color: 'var(--color-text)' }}>
                  Choose a new password
                </h2>
                <form onSubmit={handleSubmit} className='space-y-4'>
                  {[
                    { key: 'password', label: 'New Password',      placeholder: 'Min 8 characters',   autoFocus: true },
                    { key: 'confirm',  label: 'Confirm Password',   placeholder: 'Repeat new password', autoFocus: false },
                  ].map(({ key, label, placeholder, autoFocus }) => (
                    <div key={key}>
                      <label className='block text-sm mb-1.5' style={{ color: 'var(--color-text-muted)' }}>
                        {label}
                      </label>
                      <input
                        type='password'
                        value={form[key]}
                        onChange={(e) => { setForm({ ...form, [key]: e.target.value }); clearError(key); }}
                        className='w-full px-3 py-2.5 text-sm rounded-lg'
                        placeholder={placeholder}
                        autoFocus={autoFocus}
                      />
                      <FieldError message={errors[key]} />
                    </div>
                  ))}
                  {formError && (
                    <div className='text-xs' style={{ color: 'var(--color-danger-text)' }}>
                      {formError}{' '}
                      {formError.toLowerCase().includes('expired') && (
                        <Link
                          to='/forgot-password'
                          className='underline transition-opacity hover:opacity-70'
                          style={{ color: 'var(--color-accent)' }}
                        >
                          Request a new link
                        </Link>
                      )}
                    </div>
                  )}
                  <Button type='submit' loading={loading} className='w-full' size='lg'>
                    Reset Password
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ResetPasswordPage;
