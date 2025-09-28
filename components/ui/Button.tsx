import React from 'react';
import Spinner from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  isLoading = false,
  children,
  variant = 'primary',
  icon,
  className,
  ...props
}) => {
  const baseClasses = "flex items-center justify-center font-semibold py-2 px-4 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-500",
    secondary: "bg-gray-600 text-gray-200 hover:bg-gray-500 focus:ring-gray-500",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <Spinner size="sm" />
      ) : (
        <>
          {icon && <span className={children ? "mr-2" : ""}>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;