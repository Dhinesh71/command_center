import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Hexagon } from 'lucide-react';
import TrackerSidebar from '../../components/tracker/TrackerSidebar';

export default function TrackerLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-100 h-16 flex items-center justify-between px-4 z-40">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-tr from-brand-purple to-brand-pink rounded-lg flex items-center justify-center shadow-md">
                        <Hexagon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-gray-800 tracking-tight">6IXMINDS</span>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-gray-500 hover:text-gray-800 transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </header>

            <TrackerSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 min-h-screen overflow-y-auto">
                <div className="max-w-7xl mx-auto w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
