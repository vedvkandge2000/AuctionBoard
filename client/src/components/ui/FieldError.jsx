const FieldError = ({ message }) =>
  message ? (
    <p className='text-xs mt-1' style={{ color: 'var(--color-danger-text)' }}>
      {message}
    </p>
  ) : null;

export default FieldError;
