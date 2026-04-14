import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { updateMe, changePassword, deleteMe } from '../services/authService';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import FieldError from '../components/ui/FieldError';
import { validateName, validatePassword, validatePasswordMatch } from '../utils/validation';

const ROLE_BADGE = { admin: 'indigo', team_owner: 'green', viewer: 'default' };
const STATUS_BADGE = { pending: 'yellow', approved: 'green', rejected: 'red', na: 'default' };

const ProfilePage = () => {
  const { user, logout, updateUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Edit name
  const [nameVal, setNameVal] = useState(user?.name || '');
  const [nameError, setNameError] = useState(null);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  // Change password
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState({ oldPassword: null, newPassword: null, confirmPassword: null });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  // Delete account
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleSaveName = async (e) => {
    e.preventDefault();
    const err = validateName(nameVal);
    if (err) { setNameError(err); return; }
    setNameSaving(true);
    try {
      const data = await updateMe({ name: nameVal.trim() });
      updateUser({ name: data.user.name });
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update name', 'error');
    } finally {
      setNameSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const errs = {
      oldPassword: !pwForm.oldPassword ? 'Current password is required' : null,
      newPassword: validatePassword(pwForm.newPassword),
      confirmPassword: validatePasswordMatch(pwForm.newPassword, pwForm.confirmPassword),
    };
    setPwErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setPwLoading(true);
    try {
      await changePassword(pwForm);
      setPwSuccess(true);
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) { setDeleteError('Password is required'); return; }
    setDeleteLoading(true);
    try {
      await deleteMe(deletePassword);
      logout();
      navigate('/login');
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Incorrect password');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className='max-w-2xl mx-auto space-y-6'>
      <h1 className='text-2xl font-bold text-white'>My Profile</h1>

      {/* Account Info */}
      <div className='bg-gray-900 border border-gray-800 rounded-xl p-6'>
        <h2 className='text-white font-semibold mb-4'>Account Info</h2>
        <dl className='space-y-3'>
          <div className='flex justify-between items-center'>
            <dt className='text-gray-400 text-sm'>Email</dt>
            <dd className='text-white text-sm'>{user?.email}</dd>
          </div>
          <div className='flex justify-between items-center'>
            <dt className='text-gray-400 text-sm'>Role</dt>
            <dd><Badge variant={ROLE_BADGE[user?.role] || 'default'}>{user?.role?.replace('_', ' ')}</Badge></dd>
          </div>
        </dl>
      </div>

      {/* Edit Name */}
      <div className='bg-gray-900 border border-gray-800 rounded-xl p-6'>
        <h2 className='text-white font-semibold mb-4'>Display Name</h2>
        <form onSubmit={handleSaveName} className='flex gap-3 items-start'>
          <div className='flex-1'>
            <input
              type='text'
              value={nameVal}
              onChange={(e) => { setNameVal(e.target.value); setNameError(null); }}
              className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
            />
            <FieldError message={nameError} />
          </div>
          <Button type='submit' loading={nameSaving} size='sm'>Save</Button>
        </form>
        {nameSaved && <p className='text-green-400 text-xs mt-2'>Name updated successfully.</p>}
      </div>

      {/* Change Password */}
      <div className='bg-gray-900 border border-gray-800 rounded-xl p-6'>
        <h2 className='text-white font-semibold mb-4'>Change Password</h2>
        <form onSubmit={handleChangePassword} className='space-y-3'>
          <div>
            <label className='block text-gray-400 text-sm mb-1'>Current Password</label>
            <input
              type='password'
              value={pwForm.oldPassword}
              onChange={(e) => { setPwForm({ ...pwForm, oldPassword: e.target.value }); setPwErrors({ ...pwErrors, oldPassword: null }); }}
              className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              placeholder='••••••••'
            />
            <FieldError message={pwErrors.oldPassword} />
          </div>
          <div>
            <label className='block text-gray-400 text-sm mb-1'>New Password</label>
            <input
              type='password'
              value={pwForm.newPassword}
              onChange={(e) => { setPwForm({ ...pwForm, newPassword: e.target.value }); setPwErrors({ ...pwErrors, newPassword: null }); }}
              className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              placeholder='Min 8 characters'
            />
            <FieldError message={pwErrors.newPassword} />
          </div>
          <div>
            <label className='block text-gray-400 text-sm mb-1'>Confirm New Password</label>
            <input
              type='password'
              value={pwForm.confirmPassword}
              onChange={(e) => { setPwForm({ ...pwForm, confirmPassword: e.target.value }); setPwErrors({ ...pwErrors, confirmPassword: null }); }}
              className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              placeholder='Repeat new password'
            />
            <FieldError message={pwErrors.confirmPassword} />
          </div>
          <Button type='submit' loading={pwLoading}>Update Password</Button>
        </form>
        {pwSuccess && <p className='text-green-400 text-xs mt-2'>Password changed successfully.</p>}
      </div>

      {/* Danger Zone */}
      <div className='border border-red-900 rounded-xl p-6'>
        <h2 className='text-red-400 font-semibold mb-2'>Danger Zone</h2>
        <p className='text-gray-400 text-sm mb-4'>
          Permanently delete your account. This action cannot be undone.
        </p>
        <Button variant='danger' onClick={() => setDeleteOpen(true)}>Delete Account</Button>
      </div>

      {/* Delete confirmation modal */}
      <Modal open={deleteOpen} onClose={() => { setDeleteOpen(false); setDeletePassword(''); setDeleteError(null); }} title='Delete Account' size='sm'>
        <p className='text-gray-400 text-sm mb-4'>
          This will permanently delete your account. Enter your password to confirm.
        </p>
        <input
          type='password'
          value={deletePassword}
          onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(null); }}
          className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-2'
          placeholder='Your current password'
          autoFocus
        />
        {deleteError && <p className='text-red-400 text-xs mb-3'>{deleteError}</p>}
        <div className='flex gap-3 mt-4'>
          <Button variant='danger' loading={deleteLoading} onClick={handleDeleteAccount} className='flex-1'>
            Delete permanently
          </Button>
          <Button variant='ghost' onClick={() => setDeleteOpen(false)} className='flex-1'>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;
