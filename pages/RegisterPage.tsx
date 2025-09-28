import React, { useState } from 'react';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon, UserIcon } from '../components/icons';
import { ApiService } from '../src/config/api';
import WorkingPersonIllustration from '../components/WorkingPersonIllustration';

interface RegisterPageProps {
    onNavigateToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        
        if (password.length < 6) {
            alert('Password must be at least 6 characters long!');
            return;
        }
        
        try {
            const fullName = username; // sementara pakai username sebagai full_name
            const res = await ApiService.register(username, email, password, fullName);
            if (res && res.success) {
                alert('Registration successful! Please login.');
                onNavigateToLogin();
            } else {
                const msg = res?.message || res?.error || 'Registration failed';
                alert(msg);
            }
        } catch (err: any) {
            alert(err?.message || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-cyan-400 via-sky-200 to-cyan-400 flex justify-center items-center font-['Poppins'] p-4">
            <div className="container mx-auto max-w-screen-2xl max-h-[1024px] h-full flex w-full">
                {/* Left Panel */}
                <div className="hidden md:flex w-[55%] relative flex-col justify-between items-center p-10 text-white">
                    <div className="self-start">
                        {/* IAC Logo */}
                        <img src="/images/logoIAC.png" alt="IAC Logo" className="w-[220px] h-auto object-contain" />
                    </div>
                     {/* Illustration with person sitting */}
                    <WorkingPersonIllustration />
                    <div className="w-full h-20"></div> {/* Spacer */}
                </div>

                {/* Right Panel */}
                <div className="w-full md:w-[45%] flex justify-center items-center p-4">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 sm:p-12 text-center">
                        <h1 className="text-3xl font-medium text-gray-800">Welcome to <span className="text-cyan-500 font-semibold">Spacio</span></h1>
                        <h2 className="text-2xl font-medium text-cyan-500 uppercase tracking-wider mt-2 mb-8">USER REGISTRATION</h2>
                        
                        <form onSubmit={handleRegister} className="text-left">
                            <div className="relative mb-4 bg-cyan-500 rounded-lg px-5 py-2.5 flex items-center">
                                <UserIcon className="w-6 h-6 text-white mr-4" />
                                <div className="w-full">
                                    <label htmlFor="username" className="text-xs text-white/90">Username</label>
                                    <input
                                        id="username"
                                        type="text"
                                        placeholder="Choose a username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-transparent text-white placeholder-white/70 font-medium focus:outline-none"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="relative mb-4 bg-cyan-500 rounded-lg px-5 py-2.5 flex items-center">
                                <MailIcon className="w-6 h-6 text-white mr-4" />
                                <div className="w-full">
                                    <label htmlFor="email" className="text-xs text-white/90">Email</label>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="example@gmail.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-transparent text-white placeholder-white/70 font-medium focus:outline-none"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="relative mb-4 bg-cyan-500 rounded-lg px-5 py-2.5 flex items-center">
                                <LockIcon className="w-6 h-6 text-white mr-4" />
                                <div className="w-full">
                                    <label htmlFor="password" className="text-xs text-white/90">Password</label>
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create a password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-transparent text-white placeholder-white/70 font-medium focus:outline-none"
                                        required
                                    />
                                </div>
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/90">
                                    {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                </button>
                            </div>
                            
                            <div className="relative mb-4 bg-cyan-500 rounded-lg px-5 py-2.5 flex items-center">
                                <LockIcon className="w-6 h-6 text-white mr-4" />
                                <div className="w-full">
                                    <label htmlFor="confirmPassword" className="text-xs text-white/90">Confirm Password</label>
                                    <input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-transparent text-white placeholder-white/70 font-medium focus:outline-none"
                                        required
                                    />
                                </div>
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/90">
                                    {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                </button>
                            </div>
                            
                            <div className="flex justify-between items-center text-sm mb-6 text-gray-600">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input type="checkbox" className="accent-cyan-500 h-4 w-4 rounded border-gray-300 focus:ring-cyan-500 text-cyan-500" required />
                                    <span>I agree to the Terms & Conditions</span>
                                </label>
                            </div>
                            
                            <button type="submit" className="w-full bg-cyan-500 text-white font-semibold py-3.5 rounded-lg hover:bg-cyan-600 transition shadow-md text-lg">
                                Create Account
                            </button>
                        </form>

                        <p className="mt-8 text-sm text-gray-600">
                            Already have an account? <button onClick={onNavigateToLogin} className="font-medium text-cyan-500 hover:underline">Login</button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;