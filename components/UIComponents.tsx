import React from 'react';
import { Loader2 } from 'lucide-react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children, className = "", icon }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-concrete-200 overflow-hidden ${className}`}>
    {title && (
      <div className="bg-concrete-50 px-6 py-4 border-b border-concrete-200 flex items-center gap-2">
        {icon && <span className="text-primary-600">{icon}</span>}
        <h3 className="text-lg font-semibold text-concrete-800">{title}</h3>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = "", 
  disabled,
  ...props 
}) => {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-md shadow-primary-500/20",
    secondary: "bg-concrete-800 text-white hover:bg-concrete-900 focus:ring-concrete-700",
    outline: "border border-concrete-300 text-concrete-700 hover:bg-concrete-50 focus:ring-concrete-400",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  suffix?: string;
}

export const Input: React.FC<InputProps> = ({ label, suffix, className = "", ...props }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <label className="text-sm font-medium text-concrete-600">{label}</label>
    <div className="relative">
      <input 
        className="w-full px-3 py-2 bg-white border border-concrete-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-concrete-900 placeholder-concrete-400"
        {...props}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-concrete-400 text-sm pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string | number; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className = "", disabled, value, onChange, ...otherProps }) => {
  const hasValue = value !== '' && value !== undefined && value !== null;
  const showPlaceholder = !hasValue && !disabled;
  const selectValue = value === undefined || value === null ? '' : String(value);
  
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className={`text-sm font-medium ${disabled ? 'text-concrete-400' : 'text-concrete-600'}`}>{label}</label>
      <select 
        className={`w-full px-3 py-2 bg-white border border-concrete-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-concrete-900 appearance-none ${
          disabled ? 'bg-concrete-50 text-concrete-400 cursor-not-allowed' : ''
        }`}
        disabled={disabled}
        value={selectValue}
        onChange={onChange}
        {...otherProps}
      >
        {showPlaceholder && (
          <option value="">请选择...</option>
        )}
        {options.length > 0 ? (
          options.map((opt) => (
            <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
          ))
        ) : (
          !disabled && <option value="">暂无选项</option>
        )}
      </select>
    </div>
  );
};
