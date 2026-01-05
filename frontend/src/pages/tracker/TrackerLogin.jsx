import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrackerAuth } from '../../contexts/TrackerAuthContext';
import { Lock, User, Key, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TrackerLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useTrackerAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let emailToUse = username;
            if (username === '6ixmindslabs') {
                emailToUse = '6ixmindslabs@gmail.com';
            }

            if (username === '6ixmindslabs' && password !== '6@Minds^Labs') {
                throw new Error('Invalid credentials');
            }

            await signIn(emailToUse, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Authentication failed');
            if (username === '6ixmindslabs' && password === '6@Minds^Labs' && err.message.includes('Invalid login credentials')) {
                setError('Supabase Login Failed. Please ensure user "6ixmindslabs@gmail.com" exists in Supabase Auth.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-white relative overflow-hidden font-sans">
            {/* Background Ambience (Matching Home.jsx) */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-purple/20 rounded-full blur-[100px]"
                    animate={{ y: [0, 30, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-pink/20 rounded-full blur-[100px]"
                    animate={{ y: [0, -30, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md z-10 p-4"
            >
                <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl shadow-premium p-8">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-tr from-brand-purple to-brand-pink rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-brand-purple/20">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-pink tracking-tight">
                            6ixminds Labs
                        </h1>
                        <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest font-medium">Internal Portal</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wide">ID</label>
                            <div className="relative group">
                                <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-brand-purple transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter username"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-10 pr-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-transparent transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wide">Passcode</label>
                            <div className="relative group">
                                <Key className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-brand-pink transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-10 pr-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-pink/50 focus:border-transparent transition-all font-medium"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-xs font-medium text-center flex items-center justify-center gap-2">
                                <Lock className="w-3 h-3" /> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-purple/30 hover:shadow-brand-pink/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {loading ? (
                                <span className="animate-pulse">Authenticating...</span>
                            ) : (
                                <>
                                    Access Terminal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
