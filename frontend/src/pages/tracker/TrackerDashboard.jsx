import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Briefcase,
    TrendingUp,
    AlertCircle,
    RefreshCcw
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

export default function TrackerDashboard() {
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState({
        activeInterns: 0,
        totalRevenue: 0,
        outstandingAmount: 0,
        activeProjects: 0,
    });
    const [revenueData, setRevenueData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMetrics();
    }, []);

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            // HYPER-SYNC FETCH: Gather data from all modules simultaneously
            const [
                { data: allInterns },
                { data: allPayments },
                { data: projects }
            ] = await Promise.all([
                supabase.from('interns').select('*'),
                supabase.from('payments').select('*, interns(full_name), clients(company_name), tracker_projects(start_date)').order('payment_date', { ascending: false }),
                supabase.from('tracker_projects').select('*')
            ]);

            // 1. Calculate Core Metrics with FALLBACK INTELLIGENCE
            // Total Revenue: Primary source is Unified Ledger, but we check Intern Paid Fees for completeness
            const ledgerRevenue = allPayments?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
            // If ledger is empty but interns have paid_fee, we use intern data as fallback to ensure dashboard isn't blank
            const internPaidFees = allInterns?.reduce((acc, curr) => acc + (curr.paid_fee || 0), 0) || 0;
            const projectPaidAmount = projects?.reduce((acc, curr) => acc + (curr.paid_amount || 0), 0) || 0;

            // Logic: We take the MAX of ledger vs direct summations to handle any sync delays
            const totalRev = Math.max(ledgerRevenue, (internPaidFees + projectPaidAmount));

            // Outstanding = (Intern Fees Remaining) + (Project Values Remaining)
            const internOutstanding = allInterns?.reduce((acc, curr) => acc + ((curr.total_fee || 0) - (curr.paid_fee || 0)), 0) || 0;
            const projectOutstanding = projects?.reduce((acc, curr) => acc + ((curr.value || 0) - (curr.paid_amount || 0)), 0) || 0;

            setMetrics({
                activeInterns: allInterns?.filter(i => i.status === 'Active' || i.status === 'Pending').length || 0,
                activeProjects: projects?.filter(p => p.status === 'In Progress').length || 0,
                totalRevenue: totalRev,
                outstandingAmount: Math.max(0, internOutstanding + projectOutstanding)
            });

            // 2. Revenue Momentum (Last 6 Months)
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const now = new Date();
            const chartData = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                chartData.push({
                    name: months[d.getMonth()],
                    monthIndex: d.getMonth(),
                    year: d.getFullYear(),
                    value: 0
                });
            }

            // HYPER-AGGREGATION: Map revenue to months with cross-module deduplication
            const accountedInternRevenue = {};
            const accountedProjectRevenue = {};

            // A. Ledger Inflow (Primary Source)
            if (allPayments) {
                allPayments.forEach(p => {
                    // Logic: If it's a project payment, we prioritize the project's start date for the chart 
                    // to reflect the BUSINESS timeline, while using payment_date for raw accounting.
                    const rawDate = p.tracker_projects?.start_date || p.payment_date;
                    const pDate = new Date(rawDate);

                    const match = chartData.find(m => m.monthIndex === pDate.getMonth() && m.year === pDate.getFullYear());
                    const amount = Number(p.amount) || 0;
                    if (match) match.value += amount;

                    if (p.intern_id) accountedInternRevenue[p.intern_id] = (accountedInternRevenue[p.intern_id] || 0) + amount;
                    if (p.project_id) accountedProjectRevenue[p.project_id] = (accountedProjectRevenue[p.project_id] || 0) + amount;
                });
            }

            // B. Incremental Module Capturing (Catching missing entries)
            // Intern missing revenue (based on creation date)
            allInterns?.forEach(i => {
                const totalPaid = Number(i.paid_fee) || 0;
                const accounted = accountedInternRevenue[i.id] || 0;
                const missing = totalPaid - accounted;
                if (missing > 0) {
                    const pDate = new Date(i.created_at);
                    const match = chartData.find(m => m.monthIndex === pDate.getMonth() && m.year === pDate.getFullYear());
                    if (match) match.value += missing;
                }
            });

            // Project missing revenue (based on start date)
            projects?.forEach(p => {
                const totalPaid = Number(p.paid_amount) || 0;
                const accounted = accountedProjectRevenue[p.id] || 0;
                const missing = totalPaid - accounted;
                if (missing > 0) {
                    const pDate = new Date(p.start_date || p.created_at);
                    const match = chartData.find(m => m.monthIndex === pDate.getMonth() && m.year === pDate.getFullYear());
                    if (match) match.value += missing;
                }
            });

            setRevenueData(chartData);
        } catch (error) {
            console.error('Dashboard Data Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, colorClass, status, subtitle }) => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">{title}</p>
                    <h3 className="text-3xl font-black text-gray-800 tracking-tighter">{value}</h3>
                    {subtitle && <p className="text-[10px] font-bold text-gray-300 mt-2">{subtitle}</p>}
                </div>
                <div className={`p-4 rounded-2xl ${colorClass} bg-opacity-10 group-hover:rotate-12 transition-transform`}>
                    <Icon className={`w-7 h-7 ${colorClass}`} />
                </div>
            </div>
            {status && <div className="mt-6 flex items-center gap-2 text-xs font-bold text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                {status}
            </div>}
        </motion.div>
    );

    return (
        <div className="space-y-8 p-0 sm:p-2 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tighter">Command Center</h1>
                    <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-[0.3em] mt-2 opacity-60">Sixminds Labs ERP Intelligence</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={fetchMetrics} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-white transition-all shadow-sm group">
                        <RefreshCcw className={`w-5 h-5 text-brand-purple ${loading ? 'animate-spin' : 'group-hover:scale-110'}`} />
                    </button>
                    <button
                        onClick={() => navigate('/training')}
                        className="flex-1 sm:flex-none px-6 sm:px-8 py-4 bg-gradient-to-r from-brand-purple to-brand-pink text-white rounded-2xl text-[11px] sm:text-[13px] font-black shadow-xl shadow-brand-purple/20 hover:scale-[1.03] transition-all uppercase tracking-widest whitespace-nowrap"
                    >
                        New Enrollment
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard title="Training" value={metrics.activeInterns} icon={Users} colorClass="text-brand-purple" status="ACTIVE LEARNERS" />
                <StatCard title="Revenue" value={`₹${metrics.totalRevenue.toLocaleString('en-IN')}`} icon={TrendingUp} colorClass="text-emerald-500" subtitle="TOTAL COLLECTED" />
                <StatCard title="Outstanding" value={`₹${metrics.outstandingAmount.toLocaleString('en-IN')}`} icon={AlertCircle} colorClass="text-brand-pink" subtitle="INTERNS + PROJECTS" />
                <StatCard title="Projects" value={metrics.activeProjects} icon={Briefcase} colorClass="text-blue-500" status="IN PROGRESS" />
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Main Chart */}
                <div className="bg-white border border-gray-100 rounded-[40px] p-10 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-gray-800 tracking-tight">Revenue Momentum</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Global Cashflow Tracking</p>
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6C4BFF" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#6C4BFF" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="10 10" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} dy={20} fontStyle="bold" />
                                <YAxis stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                                <Tooltip contentStyle={{ background: '#fff', border: 'none', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '20px' }} />
                                <Area type="monotone" dataKey="value" stroke="#6C4BFF" strokeWidth={5} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
