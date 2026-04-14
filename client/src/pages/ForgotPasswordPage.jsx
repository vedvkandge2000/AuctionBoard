import { useState } from 'react';
import { Link } from 'react-router-dom';
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
          <div className='text-6xl mb-3'>🏏</div>
          <h1 className='text-2xl font-bold text-white'>AuctionBoard</h1>
          <p className='text-gray-400 text-sm mt-1'>Reset your password</p>
        </div>

        <div className='bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl'>
          {submitted ? (
            <div className='text-center'>
              <div className='text-4xl mb-4'>📬</div>
              <h2 className='text-white font-semibold mb-2'>Check your inbox</h2>
              <p className='text-gray-400 text-sm mb-6'>
                If that email is registered, you'll receive a reset link shortly.
              </p>
              <Link to='/login' className='text-indigo-400 hover:text-indigo-300 text-sm underline'>
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className='text-white font-semibold mb-2'>Forgot your password?</h2>
              <p className='text-gray-400 text-sm mb-5'>
                Enter the email address for your account and we'll send you a reset link.
              </p>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                  <label className='block text-gray-400 text-sm mb-1.5'>Email address</label>
                  <input
                    type='text'
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                    className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                    placeholder='you@example.com'
                    autoFocus
                  />
                  <FieldError message={emailError} />
                </div>
                {formError && <p className='text-red-400 text-xs'>{formError}</p>}
                <Button type='submit' loading={loading} className='w-full' size='lg'>
                  Send Reset Link
                </Button>
              </form>
              <p className='text-center text-gray-500 text-xs mt-4'>
                <Link to='/login' className='text-indigo-400 hover:text-indigo-300'>Back to Login</Link>
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
