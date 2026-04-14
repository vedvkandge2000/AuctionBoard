import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
      const data = await registerTeamOwner({
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
          <div className='text-6xl mb-3'>🏏</div>
          <h1 className='text-2xl font-bold text-white'>AuctionBoard</h1>
          <p className='text-gray-400 text-sm mt-1'>Register as Team Owner</p>
        </div>

        <div className='bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl'>
          <h2 className='text-white font-semibold mb-1'>Create your account</h2>
          <p className='text-gray-500 text-xs mb-5'>After registering you can browse and apply to join any open auction.</p>
          <form onSubmit={handleSubmit} className='space-y-4'>

            <div>
              <label className='block text-gray-400 text-sm mb-1.5'>Full Name</label>
              <input
                type='text'
                value={form.name}
                onChange={(e) => { setForm({ ...form, name: e.target.value }); clearError('name'); }}
                className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                placeholder='Your name'
              />
              <FieldError message={errors.name} />
            </div>
            <div>
              <label className='block text-gray-400 text-sm mb-1.5'>Email</label>
              <input
                type='text'
                value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); clearError('email'); }}
                className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                placeholder='you@example.com'
              />
              <FieldError message={errors.email} />
            </div>
            <div>
              <label className='block text-gray-400 text-sm mb-1.5'>Password</label>
              <input
                type='password'
                value={form.password}
                onChange={(e) => { setForm({ ...form, password: e.target.value }); clearError('password'); }}
                className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                placeholder='Min 8 characters'
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
                placeholder='Repeat password'
              />
              <FieldError message={errors.confirm} />
            </div>
            <Button type='submit' loading={loading} className='w-full' size='lg'>
              Create Account
            </Button>
          </form>

          <p className='text-center text-gray-500 text-xs mt-4'>
            Already have an account?{' '}
            <Link to='/login' className='text-indigo-400 hover:text-indigo-300'>Sign in</Link>
          </p>
          <p className='text-center text-gray-500 text-xs mt-2'>
            Registering as a player?{' '}
            <Link to='/register/player' className='text-indigo-400 hover:text-indigo-300'>Player registration</Link>
          </p>
        </div>
      </div>
    </div>
    </PublicLayout>
  );
};

export default RegisterPage;
