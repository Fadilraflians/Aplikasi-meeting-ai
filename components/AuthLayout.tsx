import React from 'react';

// This component is no longer in use by LoginPage and can be considered for removal.
// Keeping it for now in case RegisterPage or other future pages might use it.

const InjourneyLogo: React.FC = () => (
    <div className="absolute top-8 left-8 text-white">
        <h1 className="text-2xl font-bold">injourney</h1>
        <p className="text-sm font-light tracking-widest -mt-1">AIRPORTS</p>
    </div>
);


const AuthIllustration: React.FC = () => (
    <div className="hidden md:flex relative items-center justify-center p-8 bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-500 rounded-l-2xl">
        <InjourneyLogo />
        <img src="https://i.imgur.com/uN19wK9.png" alt="Person working at a desk" className="max-w-md" />
    </div>
);

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-cyan-300 via-sky-400 to-blue-500">
        <div className="w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
            <AuthIllustration />
            {children}
        </div>
    </div>
);

export default AuthLayout;