
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    GraduationCap,
    Building2,
    Briefcase,
    Package,
    CreditCard,
    Wallet,
    BookOpen,
    BarChart2,
    FileText,
    Settings,
    LogOut,
    Hexagon,
    X
} from 'lucide-react';
import { useTrackerAuth } from '../../contexts/TrackerAuthContext';
import InstallButton from '../InstallButton';

export default function TrackerSidebar({ isOpen, onClose }) {
    const { signOut } = useTrackerAuth();

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },

        { section: 'OPERATIONS' },
        { name: 'Training', path: '/training', icon: GraduationCap },
        { name: 'Clients', path: '/clients', icon: Building2 },
        { name: 'Products', path: '/products', icon: Package },

        { section: 'FINANCE' },
        { name: 'Intern Payments', path: '/payments/interns', icon: CreditCard },
        { name: 'Client Payments', path: '/payments/clients', icon: Wallet },
        { name: 'Revenue Ledger', path: '/finance/ledger', icon: BookOpen },

        { section: 'SYSTEM' },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            <div className={`
                w-64 bg-white border-r border-gray-100 flex flex-col h-screen fixed left-0 top-0 shadow-sm z-50 
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-brand-purple to-brand-pink rounded-xl flex items-center justify-center shadow-lg shadow-brand-purple/20">
                            <Hexagon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-800 tracking-tight leading-none text-lg">6IXMINDS</h2>
                            <span className="text-[10px] text-brand-purple font-bold tracking-widest uppercase">Labs Tracker</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 lg:hidden"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-hide">
                    {navItems.map((item, index) => {
                        if (item.section) {
                            return (
                                <div key={index} className="pt-6 pb-2 px-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.section}</p>
                                </div>
                            );
                        }

                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => {
                                    if (window.innerWidth < 1024) onClose();
                                }}
                            >
                                {({ isActive }) => (
                                    <div className={`
                                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group duration-300
                                        ${isActive
                                            ? 'bg-brand-purple/5 text-brand-purple shadow-sm ring-1 ring-brand-purple/10'
                                            : 'hover:bg-gray-50 text-gray-500 hover:text-gray-900'}
                                    `}>
                                        <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-brand-purple' : 'text-gray-400'}`} />
                                        {item.name}
                                    </div>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-2">
                    <InstallButton />
                    <button
                        onClick={signOut}
                        className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Disconnect
                    </button>
                </div>
            </div>
        </>
    );
}
