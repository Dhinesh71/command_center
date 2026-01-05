import { useState } from 'react';
import { FileText, Download, Calendar, Filter, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TrackerReports() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        type: 'All',
        fromDate: '',
        toDate: ''
    });

    const reportsData = [
        { id: 1, name: 'Monthly Enrollment Report', type: 'Internships', date: '2026-01-01', size: '245 KB' },
        { id: 2, name: 'Revenue Summary Q4 2025', type: 'Finance', date: '2025-12-31', size: '128 KB' },
        { id: 3, name: 'Project Delivery Status', type: 'Projects', date: '2026-01-01', size: '89 KB' },
        { id: 4, name: 'Trainer Performance Review', type: 'Operations', date: '2025-12-28', size: '156 KB' },
        { id: 5, name: 'Client Engagement Analysis', type: 'Clients', date: '2025-12-25', size: '203 KB' },
    ];

    const filteredReports = reportsData.filter(report => {
        const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.type.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType = filters.type === 'All' || report.type === filters.type;

        const reportDate = report.date;
        const inFromDate = !filters.fromDate || (reportDate >= filters.fromDate);
        const inToDate = !filters.toDate || (reportDate <= filters.toDate);

        return Boolean(matchesSearch && matchesType && inFromDate && inToDate);
    });

    return (
        <div className="space-y-8 max-w-[1200px] mx-auto pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tighter">Report Depository</h1>
                    <p className="text-gray-500 mt-1 font-medium text-sm sm:text-base">Unified archival & generation of operational intelligence</p>
                </div>
                <button className="w-full sm:w-auto px-6 py-4 bg-gradient-to-r from-brand-purple to-brand-pink text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-purple/20 hover:scale-105 transition-all flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4" />
                    Generate New Report
                </button>
            </div>

            {/* Report Strategy Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                <div className="bg-white border border-gray-100 rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all group">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-brand-purple" />
                    </div>
                    <h3 className="text-lg font-black text-gray-800 mb-1 sm:mb-2">Training Pulse</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-5 sm:mb-6">Enrollment & Performance</p>
                    <button className="w-full py-4 bg-gray-50 text-brand-purple text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-purple hover:text-white transition-all">Generate Strategy →</button>
                </div>

                <div className="bg-white border border-gray-100 rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all group">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-black text-gray-800 mb-1 sm:mb-2">Treasury Ledger</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-5 sm:mb-6">Financial Consolidation</p>
                    <button className="w-full py-4 bg-gray-50 text-emerald-600 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 hover:text-white transition-all">Generate Strategy →</button>
                </div>

                <div className="bg-white border border-gray-100 rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all group">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-black text-gray-800 mb-1 sm:mb-2">Asset Roadmap</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-5 sm:mb-6">Project Life-cycle Review</p>
                    <button className="w-full py-4 bg-gray-50 text-blue-600 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 hover:text-white transition-all">Generate Strategy →</button>
                </div>
            </div>

            {/* Advanced Filtering Bar */}
            <div className="bg-white border border-gray-100 rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 shadow-sm space-y-6">
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-purple transition-colors" />
                    <input
                        type="text"
                        placeholder="Search reports..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-purple/10 font-bold text-gray-700"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">From Date</label>
                        <input
                            type="date"
                            value={filters.fromDate}
                            onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">To Date</label>
                        <input
                            type="date"
                            value={filters.toDate}
                            onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Categorization</label>
                        <select
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700"
                        >
                            <option value="All">All Categories</option>
                            <option>Internships</option>
                            <option>Finance</option>
                            <option>Projects</option>
                            <option>Operations</option>
                            <option>Clients</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setFilters({ type: 'All', fromDate: '', toDate: '' });
                            }}
                            className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                        >
                            <X className="w-4 h-4" />
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Archive List */}
            <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Recent Archival Feed</h3>
                    <span className="text-[10px] font-black text-brand-purple bg-brand-purple/10 px-3 py-1 rounded-full uppercase tracking-tighter">Filtered: {filteredReports.length} Items</span>
                </div>

                <div className="divide-y divide-gray-100">
                    {filteredReports.length === 0 ? (
                        <div className="p-20 text-center opacity-40">
                            <FileText className="w-16 h-16 mx-auto mb-4" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Depository Standby</h4>
                            <p className="text-[10px] font-bold mt-1">NO MATCHING REPORTS DETECTED</p>
                        </div>
                    ) : (
                        filteredReports.map((report) => (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                key={report.id}
                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 sm:p-8 hover:bg-gray-50/50 transition-all group gap-4"
                            >
                                <div className="flex items-center gap-4 sm:gap-6">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0">
                                        <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-brand-purple" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-800 text-sm sm:text-base group-hover:text-brand-purple transition-colors">{report.name}</h4>
                                        <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-1 sm:mt-2">
                                            <span className="text-[8px] sm:text-[9px] font-black text-brand-purple bg-brand-purple/5 px-2.5 py-1 rounded-lg uppercase tracking-widest">{report.type}</span>
                                            <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                {new Date(report.date).toLocaleDateString()}
                                            </span>
                                            <span className="text-[9px] sm:text-[10px] font-black text-gray-400 tracking-tighter">{report.size}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="w-full sm:w-auto p-4 bg-gray-50 text-gray-400 hover:bg-brand-purple hover:text-white rounded-2xl transition-all shadow-sm flex items-center justify-center">
                                    <Download className="w-5 h-5" />
                                </button>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
