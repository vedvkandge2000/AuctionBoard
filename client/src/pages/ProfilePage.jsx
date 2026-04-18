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

const SectionCard = ({ title, children }) => (
  <div
    className='rounded-xl p-6'
    style={{
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
    }}
  >
    <h2 className='font-semibold mb-4' style={{ color: 'var(--color-text)' }}>{title}</h2>
    {children}
  </div>
);

const ProfilePage = () => {
  const { user, logout, updateUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [nameVal, setNameVal] = useState(user?.name || '');
  const [nameError, setNameError] = useState(null);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState({ oldPassword: null, newPassword: null, confirmPassword: null });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

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
      <h1 className='text-2xl font-bold' style={{ color: 'var(--color-text)' }}>My Profile</h1>

      <SectionCard title='Account Info'>
        <dl className='space-y-3'>
          <div className='flex justify-between items-center'>
            <dt className='text-sm' style={{ color: 'var(--color-text-muted)' }}>Email</dt>
            <dd className='text-sm' style={{ color: 'var(--color-text)' }}>{user?.email}</dd>
          </div>
          <div className='flex justify-between items-center'>
            <dt className='text-sm' style={{ color: 'var(--color-text-muted)' }}>Role</dt>
            <dd><Badge variant={ROLE_BADGE[user?.role] || 'default'}>{user?.role?.replace('_', ' ')}</Badge></dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title='Display Name'>
        <form onSubmit={handleSaveName} className='flex gap-3 items-start'>
          <div className='flex-1'>
            <input
              type='text'
              value={nameVal}
              onChange={(e) => { setNameVal(e.target.value); setNameError(null); }}
              className='w-full px-3 py-2.5 text-sm rounded-lg'
            />
            <FieldError message={nameError} />
          </div>
          <Button type='submit' loading={nameSaving} size='sm'>Save</Button>
        </form>
        {nameSaved && (
          <p className='text-xs mt-2' style={{ color: 'var(--color-success-text)' }}>
            Name updated successfully.
          </p>
        )}
      </SectionCard>

      <SectionCard title='Change Password'>
        <form onSubmit={handleChangePassword} className='space-y-3'>
          {[
            { key: 'oldPassword',     label: 'Current Password',      placeholder: '••••••••' },
            { key: 'newPassword',     label: 'New Password',           placeholder: 'Min 8 characters' },
            { key: 'confirmPassword', label: 'Confirm New Password',   placeholder: 'Repeat new password' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className='block text-sm mb-1' style={{ color: 'var(--color-text-muted)' }}>
                {label}
              </label>
              <input
                type='password'
                value={pwForm[key]}
                onChange={(e) => { setPwForm({ ...pwForm, [key]: e.target.value }); setPwErrors({ ...pwErrors, [key]: null }); }}
                className='w-full px-3 py-2.5 text-sm rounded-lg'
                placeholder={placeholder}
              />
              <FieldError message={pwErrors[key]} />
            </div>
          ))}
          <Button type='submit' loading={pwLoading}>Update Password</Button>
        </form>
        {pwSuccess && (
          <p className='text-xs mt-2' style={{ color: 'var(--color-success-text)' }}>
            Password changed successfully.
          </p>
        )}
      </SectionCard>

      {/* Danger Zone */}
      <div
        className='rounded-xl p-6'
        style={{ border: '1px solid var(--color-danger)' }}
      >
        <h2 className='font-semibold mb-2' style={{ color: 'var(--color-danger-text)' }}>
          Danger Zone
        </h2>
        <p className='text-sm mb-4' style={{ color: 'var(--color-text-muted)' }}>
          Permanently delete your account. This action cannot be undone.
        </p>
        <Button variant='danger' onClick={() => setDeleteOpen(true)}>Delete Account</Button>
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeletePassword(''); setDeleteError(null); }}
        title='Delete Account'
        size='sm'
      >
        <p className='text-sm mb-4' style={{ color: 'var(--color-text-muted)' }}>
          This will permanently delete your account. Enter your password to confirm.
        </p>
        <input
          type='password'
          value={deletePassword}
          onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(null); }}
          className='w-full px-3 py-2.5 text-sm rounded-lg mb-2'
          placeholder='Your current password'
          autoFocus
        />
        {deleteError && (
          <p className='text-xs mb-3' style={{ color: 'var(--color-danger-text)' }}>{deleteError}</p>
        )}
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
