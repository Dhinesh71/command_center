import { Settings as SettingsIcon, User, Lock, Bell, Database, Shield } from 'lucide-react';

export default function TrackerSettings() {
    return (
        <div className="space-y-8 p-1 sm:p-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tighter">System Defaults</h1>
                    <p className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-[0.3em] mt-1 sm:mt-2 opacity-60">Personal & Security Protocols</p>
                </div>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Settings */}
                <div className="bg-white border border-gray-100 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-brand-purple/10 rounded-xl">
                            <User className="w-5 h-5 text-brand-purple" />
                        </div>
                        <h3 className="text-lg font-black text-gray-800 tracking-tight">Identity Matrix</h3>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2 block">Personnel Name</label>
                            <input
                                type="text"
                                defaultValue="6ixminds Labs"
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-purple/10 font-bold text-gray-700 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2 block">Communication Channel</label>
                            <input
                                type="email"
                                defaultValue="6ixmindslabs@gmail.com"
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-purple/10 font-bold text-gray-700 transition-all"
                            />
                        </div>
                        <button className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-gray-200">
                            Update Registry
                        </button>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="bg-white border border-gray-100 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-emerald-100 rounded-xl">
                            <Lock className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-black text-gray-800 tracking-tight">Access Encryption</h3>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2 block">Current Cipher</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 font-bold text-gray-700 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2 block">New Sequence</label>
                            <input
                                type="password"
                                placeholder="New Password"
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 font-bold text-gray-700 transition-all"
                            />
                        </div>
                        <button className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
                            Rotate Keys
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
