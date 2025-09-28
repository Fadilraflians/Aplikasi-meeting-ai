import React from 'react';

// This component is no longer used by LoginPage and can be considered for removal.
// The new login page uses a custom-styled input group.

interface InputFieldProps {
    id: string;
    type: string;
    placeholder: string;
    icon: React.ReactNode;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    rightIcon?: React.ReactNode;
    onRightIconClick?: () => void;
}
const InputField: React.FC<InputFieldProps> = ({ id, type, placeholder, icon, value, onChange, rightIcon, onRightIconClick }) => (
    <div className="relative mb-4">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">{icon}</span>
        <input
            id={id}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className="w-full pl-10 pr-10 py-3 text-white placeholder-white/70 bg-sky-500 border-2 border-sky-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400 transition"
        />
        {rightIcon && (
            <button type="button" onClick={onRightIconClick} className="absolute inset-y-0 right-0 flex items-center pr-3">
                {rightIcon}
            </button>
        )}
    </div>
);

export default InputField;