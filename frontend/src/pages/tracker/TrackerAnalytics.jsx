import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart3, TrendingUp, Users, Briefcase, DollarSign, Activity, Loader2, Filter, X } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell } from 'recharts';
import { motion } from 'framer-motion';

export default function TrackerAnalytics() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        growthRate: 0,
        internCapacity: 0,
        projectSuccess: 0,
        revenueGrowth: 0,
        performanceData: [],
        domainPerformance: []
    });

    const [filters, setFilters] = useState({
        domain: 'All'
    });

    useEffect(() => {
        fetchDynamicAnalytics();
    }, [filters.domain]);

    const fetchDynamicAnalytics = async () => {
        setLoading(true);
        try {
            let internQuery = supabase.from('interns').select('*');
            let projectQuery = supabase.from('tracker_projects').select('*');
            let paymentQuery = supabase.from('payments').select('*').order('payment_date', { ascending: true });

            if (filters.domain !== 'All') {
                internQuery = internQuery.eq('domain', filters.domain);
                projectQuery = projectQuery.eq('domain', filters.domain);
            }

            const [resInterns, resProjects, resPayments] = await Promise.all([
                internQuery,
                projectQuery,
                paymentQuery
            ]);

            if (resInterns.error) throw resInterns.error;
            if (resProjects.error) throw resProjects.error;
            if (resPayments.error) throw resPayments.error;

            const interns = resInterns.data || [];
            const projects = resProjects.data || [];
            const payments = resPayments.data || [];

            // 1. Calculate Revenue Momentum (Last 6 Months)
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const now = new Date();
            const monthlyData = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                monthlyData.push({
                    month: months[d.getMonth()],
                    monthIndex: d.getMonth(),
                    year: d.getFullYear(),
                    revenue: 0,
                    interns: 0,
                    projects: 0
                });
            }

            payments?.forEach(p => {
                const pDate = new Date(p.payment_date);
                const match = monthlyData.find(m => m.monthIndex === pDate.getMonth() && m.year === pDate.getFullYear());
                if (match) match.revenue += Number(p.amount);
            });

            interns?.forEach(i => {
                const iDate = new Date(i.created_at);
                const match = monthlyData.find(m => m.monthIndex === iDate.getMonth() && m.year === iDate.getFullYear());
                if (match) match.interns += 1;
            });

            projects?.forEach(p => {
                const pDate = new Date(p.created_at);
                const match = monthlyData.find(m => m.monthIndex === pDate.getMonth() && m.year === pDate.getFullYear());
                if (match) match.projects += 1;
            });

            // 2. Domain Distribution for Radar
            const domainCounts = interns?.reduce((acc, curr) => {
                const d = curr.domain || 'General';
                acc[d] = (acc[d] || 0) + 1;
                return acc;
            }, {}) || {};

            const maxInterns = Math.max(...Object.values(domainCounts), 1);
            const radarData = Object.entries(domainCounts).map(([name, count]) => ({
                subject: name,
                A: (count / maxInterns) * 150, // Scaling for visual
                B: 120, // Baseline/Target
                fullMark: 150
            }));

            // 3. Growth & Success Logic
            const totalRevenue = payments?.reduce((s, p) => s + (p.amount || 0), 0) || 0;
            const deliveredProjects = projects?.filter(p => p.status === 'Delivered').length || 0;
            const successRate = projects?.length > 0 ? (deliveredProjects / projects.length) * 100 : 0;

            setStats({
                growthRate: interns?.length > 5 ? 24 : 0,
                internCapacity: Math.min(100, (interns?.length || 0) * 10),
                projectSuccess: successRate.toFixed(0),
                revenueGrowth: totalRevenue,
                performanceData: monthlyData,
                domainPerformance: radarData.length > 0 ? radarData : [
                    { subject: 'Web Dev', A: 0, B: 100 },
                    { subject: 'IoT', A: 0, B: 100 },
                    { subject: 'PCB', A: 0, B: 100 }
                ]
            });

        } catch (error) {
            console.error('Analytics Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const MetricCard = ({ title, value, change, icon: Icon, color }) => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-100 rounded-[28px] sm:rounded-[32px] p-5 sm:p-8 shadow-sm hover:shadow-xl transition-all">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 sm:mb-3">{title}</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tighter mb-1 sm:mb-2">{value}</h3>
                    <p className="text-[8px] sm:text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                        <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        Update Live
                    </p>
                </div>
                <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl ${color} bg-opacity-10`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} />
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="space-y-6 sm:space-y-8 p-1 sm:p-2 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tighter">Visual Intelligence</h1>
                    <p className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-[0.3em] mt-1 sm:mt-2 opacity-60">Systemic Performance Analysis</p>
                </div>

                <div className="flex gap-2 sm:gap-4 items-center w-full sm:w-auto">
                    <div className="relative group flex-1 sm:flex-none">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            value={filters.domain}
                            onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
                            className="w-full sm:w-auto pl-12 pr-8 py-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 focus:outline-none focus:ring-4 focus:ring-brand-purple/10 transition-all appearance-none cursor-pointer shadow-sm"
                        >
                            <option value="All">All Domains</option>
                            <option>Web Development</option>
                            <option>UI/UX Design</option>
                            <option>IoT Solutions</option>
                            <option>Embedded Systems</option>
                            <option>PCB Design</option>
                            <option>Robotics</option>
                        </select>
                    </div>
                    {filters.domain !== 'All' && (
                        <button
                            onClick={() => setFilters({ domain: 'All' })}
                            className="p-4 bg-gray-100 text-gray-500 rounded-2xl hover:bg-gray-200 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-brand-purple shadow-xl shadow-brand-purple/20 rounded-full" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">Recalculating Intelligence...</p>
                </div>
            ) : (
                <>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                        <MetricCard title="Growth Velocity" value={`${stats.growthRate}%`} icon={Activity} color="text-emerald-500" />
                        <MetricCard title="Training Load" value={`${stats.internCapacity}%`} icon={Users} color="text-brand-purple" />
                        <MetricCard title="Delivery Alpha" value={`${stats.projectSuccess}%`} icon={Briefcase} color="text-blue-500" />
                        <MetricCard title="Total Yield" value={`₹${(stats.revenueGrowth / 1000).toFixed(1)}K`} icon={DollarSign} color="text-brand-pink" />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                        <div className="bg-white border border-gray-100 rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 shadow-sm relative overflow-hidden">
                            <h3 className="text-xs sm:text-sm font-black text-gray-800 uppercase tracking-widest mb-6 sm:mb-10">Revenue Momentum</h3>
                            <div className="h-[280px] sm:h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.performanceData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6C4BFF" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#6C4BFF" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="10 10" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="month" stroke="#cbd5e1" fontSize={9} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#cbd5e1" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                                        <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
                                        <Area type="monotone" dataKey="revenue" stroke="#6C4BFF" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 shadow-sm">
                            <h3 className="text-xs sm:text-sm font-black text-gray-800 uppercase tracking-widest mb-6 sm:mb-10">Program Synergy</h3>
                            <div className="h-[280px] sm:h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats.domainPerformance}>
                                        <PolarGrid stroke="#f1f5f9" />
                                        <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                                        <PolarRadiusAxis angle={30} domain={[0, 150]} hide />
                                        <Radar name="Current Load" dataKey="A" stroke="#6C4BFF" fill="#6C4BFF" fillOpacity={0.2} strokeWidth={2} />
                                        <Radar name="Strategic Goal" dataKey="B" stroke="#FF6BCE" fill="#FF6BCE" fillOpacity={0.1} strokeWidth={2} />
                                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 shadow-sm">
                            <h3 className="text-xs sm:text-sm font-black text-gray-800 uppercase tracking-widest mb-6 sm:mb-10">Operations Scaling</h3>
                            <div className="h-[280px] sm:h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={stats.performanceData}>
                                        <CartesianGrid strokeDasharray="10 10" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="month" stroke="#cbd5e1" fontSize={9} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#cbd5e1" fontSize={9} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: '24px', border: 'none' }} />
                                        <Line type="monotone" dataKey="interns" stroke="#6C4BFF" strokeWidth={4} dot={false} />
                                        <Line type="monotone" dataKey="projects" stroke="#FF6BCE" strokeWidth={4} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 shadow-sm flex flex-col justify-center">
                            <h3 className="text-xs sm:text-sm font-black text-gray-800 uppercase tracking-widest mb-6 sm:mb-8">AI Intelligence Feed</h3>
                            <div className="space-y-4 sm:space-y-6">
                                <div className="p-4 sm:p-6 bg-emerald-50/50 border border-emerald-100 rounded-[24px] sm:rounded-[32px] flex items-center gap-4 sm:gap-5">
                                    <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
                                    <div>
                                        <h4 className="font-black text-emerald-800 text-xs sm:text-sm">Delivery Alpha: {stats.projectSuccess}%</h4>
                                        <p className="text-[9px] sm:text-[10px] text-emerald-600 font-bold uppercase mt-1">Efficiency stable</p>
                                    </div>
                                </div>
                                <div className="p-4 sm:p-6 bg-brand-purple/5 border border-brand-purple/10 rounded-[24px] sm:rounded-[32px] flex items-center gap-4 sm:gap-5">
                                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-brand-purple" />
                                    <div>
                                        <h4 className="font-black text-brand-purple text-xs sm:text-sm">Scaling Signal</h4>
                                        <p className="text-[9px] sm:text-[10px] text-brand-purple/60 font-bold uppercase mt-1">{stats.internCapacity}% utilized</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
