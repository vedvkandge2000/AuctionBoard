const FieldError = ({ message }) =>
  message ? <p className='text-red-400 text-xs mt-1'>{message}</p> : null;

export default FieldError;
