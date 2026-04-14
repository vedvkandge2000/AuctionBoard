import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
          <div className='text-6xl mb-3'>🏏</div>
          <h1 className='text-2xl font-bold text-white'>AuctionBoard</h1>
          <p className='text-gray-400 text-sm mt-1'>Set a new password</p>
        </div>

        <div className='bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl'>
          {done ? (
            <div className='text-center'>
              <div className='text-4xl mb-4'>✅</div>
              <h2 className='text-white font-semibold mb-2'>Password reset!</h2>
              <p className='text-gray-400 text-sm mb-6'>Your password has been updated. You can now sign in.</p>
              <Link to='/login' className='text-indigo-400 hover:text-indigo-300 text-sm underline'>
                Go to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className='text-white font-semibold mb-5'>Choose a new password</h2>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                  <label className='block text-gray-400 text-sm mb-1.5'>New Password</label>
                  <input
                    type='password'
                    value={form.password}
                    onChange={(e) => { setForm({ ...form, password: e.target.value }); clearError('password'); }}
                    className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                    placeholder='Min 8 characters'
                    autoFocus
                  />
                  <FieldError message={errors.password} />
                </div>
                <div>
                  <label className='block text-gray-400 text-sm mb-1.5'>Confirm Password</label>
                  <input
                    type='password'
                    value={form.confirm}
                    onChange={(e) => { setForm({ ...form, confirm: e.target.value }); clearError('confirm'); }}
                    className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                    placeholder='Repeat new password'
                  />
                  <FieldError message={errors.confirm} />
                </div>
                {formError && (
                  <div className='text-red-400 text-xs'>
                    {formError}{' '}
                    {formError.toLowerCase().includes('expired') && (
                      <Link to='/forgot-password' className='text-indigo-400 hover:text-indigo-300 underline'>
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
