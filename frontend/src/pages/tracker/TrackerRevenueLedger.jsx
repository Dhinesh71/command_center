import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BookOpen, TrendingUp, Download, Calendar, DollarSign, PieChart as PieIcon, Activity, ArrowUpRight, Search, FileSpreadsheet, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';

export default function TrackerRevenueLedger() {
    const [ledgerData, setLedgerData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        type: 'All',
        fromDate: '',
        toDate: ''
    });

    useEffect(() => {
        fetchLedger();
    }, []);

    const fetchLedger = async () => {
        try {
            const { data, error } = await supabase
                .from('payments')
                .select('*')
                .order('payment_date', { ascending: false });

            if (error) throw error;
            setLedgerData(data || []);
        } catch (error) {
            console.error('Error fetching ledger:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLedger = ledgerData.filter(p => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            (p.type || '').toLowerCase().includes(query) ||
            (p.transaction_id || '').toLowerCase().includes(query);

        const matchesType = filters.type === 'All' || p.type === filters.type;

        const recordDate = p.payment_date || '';
        const inFromDate = !filters.fromDate || (recordDate !== '' && recordDate >= filters.fromDate);
        const inToDate = !filters.toDate || (recordDate !== '' && recordDate <= filters.toDate);

        return Boolean(matchesSearch && matchesType && inFromDate && inToDate);
    });

    const exportToExcel = () => {
        const dataToExport = filteredLedger.map(p => ({
            'Type': p.type,
            'Amount': p.amount,
            'Date': p.payment_date,
            'Reference ID': p.transaction_id || 'INTERNAL',
            'Method': p.payment_method || 'N/A',
            'Status': p.status
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Revenue Ledger");
        XLSX.writeFile(workbook, `6ixminds_revenue_ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const internshipRevenue = ledgerData.filter(p => p.type === 'Internship Fee').reduce((sum, p) => sum + (p.amount || 0), 0);
    const projectRevenue = ledgerData.filter(p => p.type === 'Project Milestone').reduce((sum, p) => sum + (p.amount || 0), 0);
    const productRevenue = ledgerData.filter(p => p.type === 'Product Sale').reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalRevenue = internshipRevenue + projectRevenue + productRevenue;

    const revenueByType = [
        { name: 'Training', value: internshipRevenue, color: '#6C4BFF' },
        { name: 'Projects', value: projectRevenue, color: '#00D1FF' },
        { name: 'Products', value: productRevenue, color: '#FF6BCE' },
    ];

    const StatCard = ({ title, value, icon: Icon, color, trend }) => (
        <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
                <div className={`p-4 rounded-2xl ${color} bg-opacity-10 shadow-sm`}>
                    <Icon className={`w-7 h-7 ${color}`} />
                </div>
                {trend && (
                    <div className="flex items-center gap-1 text-emerald-500 font-bold bg-emerald-50 px-3 py-1 rounded-full text-xs">
                        <ArrowUpRight className="w-3 h-3" />
                        {trend}
                    </div>
                )}
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{title}</p>
            <h3 className="text-4xl font-black text-gray-800 tracking-tighter">₹{value.toLocaleString('en-IN')}</h3>
        </div>
    );

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tighter flex items-center gap-3">
                        <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-brand-purple" />
                        Treasury Ledger
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium text-sm sm:text-base">Real-time consolidated capital intelligence.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setFilters({ type: 'All', fromDate: '', toDate: '' });
                        }}
                        className="px-6 py-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                        <X className="w-4 h-4" />
                        Clear
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="px-6 py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Core Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                <StatCard
                    title="Aggregate Yield"
                    value={totalRevenue}
                    icon={Activity}
                    color="text-brand-purple"
                    trend="+12.5%"
                />
                <StatCard
                    title="Training Feed"
                    value={internshipRevenue}
                    icon={TrendingUp}
                    color="text-brand-purple"
                />
                <StatCard
                    title="Dev Pipeline"
                    value={projectRevenue}
                    icon={TrendingUp}
                    color="text-blue-500"
                />
                <StatCard
                    title="Asset Sales"
                    value={productRevenue}
                    icon={TrendingUp}
                    color="text-brand-pink"
                />
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white border border-gray-100 rounded-[24px] sm:rounded-[32px] p-4 sm:p-8 shadow-sm space-y-6">
                <div className="relative group">
                    <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-gray-300 group-focus-within:text-brand-purple transition-colors" />
                    <input
                        type="text"
                        placeholder="Search ledger..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-4 sm:py-5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-purple/10 focus:bg-white transition-all font-bold text-gray-700 placeholder:text-gray-300 placeholder:font-black placeholder:text-[9px] placeholder:tracking-widest"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">From Date</label>
                        <input
                            type="date"
                            value={filters.fromDate}
                            onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                            className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">To Date</label>
                        <input
                            type="date"
                            value={filters.toDate}
                            onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                            className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                        />
                    </div>
                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Revenue Type</label>
                        <select
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                            className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                        >
                            <option value="All">All Streams</option>
                            <option value="Internship Fee">Training Revenue</option>
                            <option value="Project Milestone">Project Milestone</option>
                            <option value="Product Sale">Product Sale</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Visual Intelligence */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white border border-gray-100 rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700 hidden sm:block">
                        <PieIcon className="w-40 h-40 text-brand-purple" />
                    </div>
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest mb-6 sm:mb-10 flex items-center gap-2">
                        <div className="w-2 h-2 bg-brand-purple rounded-full animate-pulse" />
                        Domain Allocation
                    </h3>
                    <div className="h-[280px] sm:h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={revenueByType}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {revenueByType.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
                                    formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-4 mt-8">
                        {revenueByType.map((item) => (
                            <div key={item.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{item.name}</span>
                                </div>
                                <span className="text-sm font-black text-gray-800">
                                    {totalRevenue > 0 ? ((item.value / totalRevenue) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-10 gap-4">
                        <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-500" />
                            Unified Transaction Feed
                        </h3>
                        <span className="text-[10px] font-black text-gray-400 tracking-tighter">DISPLAYING ARCHIVE L10</span>
                    </div>

                    <div className="overflow-hidden">
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 scrollbar-hide">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <div className="w-12 h-12 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin"></div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hydrating Ledger...</p>
                                </div>
                            ) : filteredLedger.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                                    <BookOpen className="w-16 h-16 mb-4" />
                                    <h3 className="text-xs font-black uppercase tracking-widest">Standby Mode</h3>
                                    <p className="text-[10px] font-bold mt-1">NO INFLOW SIGNALS DETECTED</p>
                                </div>
                            ) : (
                                filteredLedger.map((transaction, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={transaction.id}
                                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 bg-gray-50/50 rounded-2xl sm:rounded-3xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 group gap-4"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl ${transaction.type === 'Internship Fee' ? 'bg-brand-purple/10 text-brand-purple' : transaction.type === 'Project Milestone' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                                                <TrendingUp className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{transaction.type}</p>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3 h-3 text-gray-300" />
                                                    <span className="text-xs font-bold text-gray-600">
                                                        {transaction.payment_date ? new Date(transaction.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-left sm:text-right w-full sm:w-auto">
                                            <p className="text-lg sm:text-xl font-black text-gray-800 tracking-tighter">₹{(transaction.amount || 0).toLocaleString('en-IN')}</p>
                                            <p className="text-[9px] sm:text-[10px] font-mono font-bold text-brand-purple opacity-40 uppercase">{transaction.transaction_id || 'INTERNAL'}</p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
