import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}

export default function Button({ 
  children, 
  onClick, 
  type = 'button', 
  disabled = false,
  className = ''
}: ButtonProps) {
  const baseClasses = "w-full h-12 bg-gradient-to-r from-[#1F2937] to-[#111827] text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${className}`}
    >
      {children}
    </button>
  );
}
