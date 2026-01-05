import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Plus, Shield, Edit2, Trash2, X, Loader2, Mail, ExternalLink, Copy, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TrackerUsers() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProfiles(data || []);
        } catch (error) {
            console.error('Error fetching profiles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async (id, newRole) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', id);

            if (error) throw error;
            fetchProfiles();
        } catch (error) {
            alert('Error updating role: ' + error.message);
        }
    };

    const copyInviteLink = () => {
        const link = `${window.location.origin}/login`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const roles = [
        { name: 'admin', label: 'Admin', color: 'text-brand-purple', bg: 'bg-brand-purple/10', permissions: 'Full access to all modules' },
        { name: 'trainer', label: 'Trainer', color: 'text-blue-600', bg: 'bg-blue-50', permissions: 'Training operations and intern management' },
        { name: 'finance', label: 'Finance', color: 'text-emerald-600', bg: 'bg-emerald-50', permissions: 'Payment tracking and financial reports' },
        { name: 'project_lead', label: 'Project Lead', color: 'text-brand-pink', bg: 'bg-pink-50', permissions: 'Project and client management' },
    ];

    return (
        <div className="space-y-8 p-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tighter">Identity & Access</h1>
                    <p className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-[0.3em] mt-1 sm:mt-2 opacity-60">Team Role Management System</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-purple to-brand-pink text-white rounded-[20px] text-[13px] font-black shadow-xl shadow-brand-purple/20 hover:scale-[1.03] transition-all uppercase tracking-widest flex items-center justify-center gap-3"
                >
                    <Plus className="w-5 h-5 stroke-[3px]" />
                    Onboard Member
                </button>
            </div>

            {/* Roles Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                {roles.map((role) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={role.name}
                        className="bg-white border border-gray-100 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform"></div>
                        <div className="flex items-start justify-between mb-4 sm:mb-6 relative">
                            <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl ${role.bg}`}>
                                <Shield className={`w-5 h-5 sm:w-6 sm:h-6 ${role.color}`} />
                            </div>
                            <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full">
                                {profiles.filter(p => p.role === role.name || (role.name === 'admin' && !p.role)).length} Active
                            </span>
                        </div>
                        <h3 className={`font-black text-lg sm:text-xl mb-1 sm:mb-2 capitalize ${role.color}`}>{role.label}</h3>
                        <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider leading-relaxed pr-2 sm:pr-4 opacity-70">{role.permissions}</p>
                    </motion.div>
                ))}
            </div>

            {/* Members Table */}
            <div className="bg-white border border-gray-100 rounded-[28px] sm:rounded-[40px] shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                    <h3 className="text-xs sm:text-sm font-black text-gray-800 uppercase tracking-widest">Authorized Personnel</h3>
                </div>
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Identity</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Authority Level</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Registry Date</th>
                                <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocols</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-8 py-24 text-center">
                                        <Loader2 className="w-12 h-12 animate-spin text-brand-purple/20 mx-auto" />
                                    </td>
                                </tr>
                            ) : profiles.map((profile) => (
                                <tr key={profile.id} className="hover:bg-gray-50/30 transition-all group">
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-gradient-to-tr from-brand-purple to-brand-pink rounded-2xl flex items-center justify-center shadow-lg shadow-brand-purple/10 overflow-hidden transform group-hover:rotate-3 transition-transform">
                                                {profile.avatar_url ? (
                                                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-white font-black text-xl">{(profile.username || profile.full_name || 'U')[0].toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-black text-gray-800 text-[15px]">{profile.full_name || profile.username || 'Unverified Unit'}</div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase mt-1 flex items-center gap-1.5">
                                                    <Mail className="w-3 h-3" /> {profile.username}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <select
                                            value={profile.role || 'admin'}
                                            onChange={(e) => handleUpdateRole(profile.id, e.target.value)}
                                            className="bg-white border border-gray-200 text-gray-800 text-[11px] font-black uppercase tracking-wider px-5 py-2.5 rounded-[15px] focus:outline-none focus:ring-4 focus:ring-brand-purple/10 cursor-pointer shadow-sm hover:border-brand-purple/30 transition-all"
                                        >
                                            {roles.map(r => (
                                                <option key={r.name} value={r.name}>{r.label.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })}</div>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-brand-purple transition-all">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button className="p-3 bg-red-50 rounded-xl text-red-300 hover:text-red-500 transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="lg:hidden divide-y divide-gray-100">
                    {loading ? (
                        <div className="p-12 text-center"><Loader2 className="w-12 h-12 animate-spin text-brand-purple/20 mx-auto" /></div>
                    ) : profiles.map((profile) => (
                        <div key={`mobile-${profile.id}`} className="p-5 space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-tr from-brand-purple to-brand-pink rounded-xl flex items-center justify-center shrink-0">
                                    <span className="text-white font-black">{(profile.username || 'U')[0].toUpperCase()}</span>
                                </div>
                                <div className="min-w-0">
                                    <div className="font-black text-gray-800 text-sm truncate">{profile.full_name || profile.username}</div>
                                    <div className="text-[10px] font-bold text-gray-400 truncate uppercase mt-0.5">{profile.role || 'ADMIN'}</div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <select
                                    value={profile.role || 'admin'}
                                    onChange={(e) => handleUpdateRole(profile.id, e.target.value)}
                                    className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest focus:ring-0 cursor-pointer"
                                >
                                    {roles.map(r => (
                                        <option key={r.name} value={r.name}>{r.label}</option>
                                    ))}
                                </select>
                                <div className="flex gap-2">
                                    <button className="p-2 text-gray-400 hover:text-brand-purple"><Edit2 className="w-4 h-4" /></button>
                                    <button className="p-2 text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Onboard Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden"
                        >
                            <div className="relative p-7 sm:p-10">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="absolute top-6 sm:top-8 right-6 sm:right-8 p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-brand-purple transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brand-purple/5 rounded-[20px] sm:rounded-[24px] flex items-center justify-center mb-6 sm:mb-8">
                                    <Users className="w-8 h-8 sm:w-10 sm:h-10 text-brand-purple" />
                                </div>

                                <h2 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tighter mb-4">Onboard Team</h2>
                                <p className="text-gray-500 font-bold text-xs sm:text-sm leading-relaxed mb-8 sm:mb-10">
                                    Team members must register through the terminal. Share this unique entry point with your personnel.
                                </p>

                                <div className="space-y-4 sm:space-y-6">
                                    <div className="p-5 sm:p-6 bg-gray-50 rounded-[24px] sm:rounded-[30px] border border-gray-100">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Access Point URL</label>
                                        <div className="flex gap-2 sm:gap-3">
                                            <input
                                                type="text"
                                                readOnly
                                                value={`${window.location.origin}/login`}
                                                className="bg-white border border-gray-100 flex-1 px-4 py-3 rounded-xl text-[10px] font-bold text-gray-600 focus:outline-none truncate"
                                            />
                                            <button
                                                onClick={copyInviteLink}
                                                className={`p-3 rounded-xl transition-all flex items-center gap-2 shrink-0 ${copied ? 'bg-emerald-500 text-white' : 'bg-brand-purple text-white hover:bg-brand-purple/90'}`}
                                            >
                                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 sm:gap-4 p-5 sm:p-6 bg-amber-50 rounded-[24px] sm:rounded-[30px] border border-amber-100">
                                        <Info className="w-5 h-5 text-amber-500 mt-1 shrink-0" />
                                        <div>
                                            <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1">Post-Registration</p>
                                            <p className="text-[10px] font-bold text-amber-600 leading-relaxed">
                                                Profile will appear in registry after sign up. Advance clearance in the matrix below.
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        className="w-full py-4 bg-gray-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-700 transition-all shadow-xl shadow-gray-200"
                                    >
                                        Acknowledge
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
