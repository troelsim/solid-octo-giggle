import './Button.css';

function Button({ children, variant = 'primary', onClick, className = '', ...props }) {
  return (
    <button
      className={`btn btn-${variant} ${className}`.trim()}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
