const NAME_REGEX = /^[a-zA-Z\s]{2,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const validateName = (val) => {
  if (!val || val.trim().length < 2) return 'Name must be at least 2 characters';
  if (!NAME_REGEX.test(val.trim())) return 'Name may only contain letters and spaces';
  return null;
};

export const validateEmail = (val) => {
  if (!val || !val.trim()) return 'Email is required';
  if (!EMAIL_REGEX.test(val.trim())) return 'Enter a valid email address';
  return null;
};

export const validatePassword = (val) => {
  if (!val) return 'Password is required';
  if (!PASSWORD_REGEX.test(val))
    return 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number';
  return null;
};

export const validatePasswordMatch = (pw, confirm) => {
  if (pw !== confirm) return 'Passwords do not match';
  return null;
};
