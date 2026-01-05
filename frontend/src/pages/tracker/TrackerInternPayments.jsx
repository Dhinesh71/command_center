import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Filter, CreditCard, Calendar, CheckCircle, XCircle, X, Loader2, Trash2, Edit2, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

export default function TrackerInternPayments() {
    const [payments, setPayments] = useState([]);
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    // Filter State
    const [filters, setFilters] = useState({
        method: 'All',
        status: 'All',
        fromDate: '',
        toDate: ''
    });

    // Form State
    const [formData, setFormData] = useState({
        intern_id: '',
        amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'UPI',
        transaction_id: '',
        status: 'Completed',
        type: 'Internship Fee'
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        await Promise.all([fetchPayments(), fetchInterns()]);
        setLoading(false);
    };

    const fetchPayments = async () => {
        try {
            const { data, error } = await supabase
                .from('payments')
                .select(`
                    *,
                    interns (full_name, email)
                `)
                .eq('type', 'Internship Fee')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPayments(data || []);
        } catch (error) {
            console.error('Error fetching payments:', error);
        }
    };

    const fetchInterns = async () => {
        try {
            const { data, error } = await supabase
                .from('interns')
                .select('id, full_name, email')
                .order('full_name');

            if (error) throw error;
            setInterns(data || []);
            if (data?.length > 0 && !formData.intern_id) {
                setFormData(prev => ({ ...prev, intern_id: data[0].id }));
            }
        } catch (error) {
            console.error('Error fetching interns:', error);
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const dataToSubmit = {
            ...formData,
            payment_date: formData.payment_date || new Date().toISOString().split('T')[0]
        };

        try {
            if (editingId) {
                // 1. Update existing payment
                const { error: paymentError } = await supabase
                    .from('payments')
                    .update(dataToSubmit)
                    .eq('id', editingId);

                if (paymentError) throw paymentError;
            } else {
                // 1. Record new payment
                const { error: paymentError } = await supabase
                    .from('payments')
                    .insert([dataToSubmit]);

                if (paymentError) throw paymentError;
            }

            // 2. Reflective Intelligence: Update intern stats
            await syncInternStats(formData.intern_id);

            setShowAddModal(false);
            setEditingId(null);
            resetForm();
            fetchPayments();
        } catch (error) {
            alert('Error saving record: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            intern_id: interns[0]?.id || '',
            amount: 0,
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: 'UPI',
            transaction_id: '',
            status: 'Completed',
            type: 'Internship Fee'
        });
    };

    const handleOpenEdit = (payment) => {
        setEditingId(payment.id);
        setFormData({
            intern_id: payment.intern_id,
            amount: payment.amount,
            payment_date: payment.payment_date,
            payment_method: payment.payment_method,
            transaction_id: payment.transaction_id,
            status: payment.status,
            type: payment.type
        });
        setShowAddModal(true);
    };

    const handleOpenAdd = () => {
        setEditingId(null);
        resetForm();
        setShowAddModal(true);
    };

    const handleDeletePayment = async (payment) => {
        if (!confirm('Are you sure you want to delete this payment record? This will revert the intern\'s balance.')) return;

        try {
            // 1. Delete the payment
            const { error: deleteError } = await supabase
                .from('payments')
                .delete()
                .eq('id', payment.id);

            if (deleteError) throw deleteError;

            // 2. Reflective Intelligence: Re-calculate and Sync intern stats
            if (payment.intern_id) {
                await syncInternStats(payment.intern_id);
            }

            fetchPayments();
        } catch (error) {
            alert('Error deleting legacy: ' + error.message);
        }
    };

    // Master Sync Function: Recalculates everything for an intern based on their actual payment history
    const syncInternStats = async (internId) => {
        // Fetch ALL payments for this intern
        const { data: allInternPayments } = await supabase
            .from('payments')
            .select('amount')
            .eq('intern_id', internId)
            .eq('status', 'Completed');

        const { data: intern } = await supabase
            .from('interns')
            .select('total_fee')
            .eq('id', internId)
            .single();

        const newPaidTotal = allInternPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        let newStatus = 'Unpaid';
        if (newPaidTotal >= (intern?.total_fee || 0) && (intern?.total_fee || 0) > 0) {
            newStatus = 'Paid';
        } else if (newPaidTotal > 0) {
            newStatus = 'Partial';
        }

        await supabase
            .from('interns')
            .update({
                paid_fee: newPaidTotal,
                payment_status: newStatus
            })
            .eq('id', internId);
    };

    const totalReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const completedPayments = payments.filter(p => p.status === 'Completed').length;

    const filteredPayments = payments.filter(payment => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            (payment.interns?.full_name || '').toLowerCase().includes(query) ||
            (payment.transaction_id || '').toLowerCase().includes(query);

        const matchesMethod = filters.method === 'All' || payment.payment_method === filters.method;
        const matchesStatus = filters.status === 'All' || payment.status === filters.status;

        const recordDate = payment.payment_date || '';
        const inFromDate = !filters.fromDate || (recordDate !== '' && recordDate >= filters.fromDate);
        const inToDate = !filters.toDate || (recordDate !== '' && recordDate <= filters.toDate);

        return Boolean(matchesSearch && matchesMethod && matchesStatus && inFromDate && inToDate);
    });

    const exportToExcel = () => {
        const dataToExport = filteredPayments.map(p => ({
            'Intern Name': p.interns?.full_name,
            'Email': p.interns?.email,
            'Amount': p.amount,
            'Method': p.payment_method,
            'Transaction ID': p.transaction_id,
            'Status': p.status,
            'Date': p.payment_date
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Intern Payments");
        XLSX.writeFile(workbook, `6ixminds_intern_payments_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">Financial Ecosystem: Interns</h1>
                    <p className="text-gray-500 mt-1">Unified ledger syncing training & revenue states</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="w-full sm:w-auto px-6 py-4 bg-gradient-to-r from-brand-purple to-brand-pink text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-purple/30 hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Record Payment
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard title="Total Collected" value={`₹${totalReceived.toLocaleString('en-IN')}`} icon={CreditCard} color="text-emerald-500" />
                <StatCard title="Ledger Entries" value={payments.length} icon={CreditCard} color="text-brand-purple" />
                <StatCard title="Successful" value={completedPayments} icon={CheckCircle} color="text-blue-500" />
                <StatCard title="Awaiting" value={payments.length - completedPayments} icon={XCircle} color="text-brand-pink" />
            </div>

            <div className="bg-white border border-gray-100 rounded-[24px] sm:rounded-[32px] p-4 sm:p-8 shadow-sm space-y-6">
                <div className="relative group">
                    <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-gray-300 group-focus-within:text-brand-purple transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by intern name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-4 sm:py-5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-purple/10 focus:bg-white transition-all font-bold text-gray-700 placeholder:text-gray-300 placeholder:font-black placeholder:text-[9px] placeholder:tracking-widest"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">From Date</label>
                        <input
                            type="date"
                            value={filters.fromDate}
                            onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">To Date</label>
                        <input
                            type="date"
                            value={filters.toDate}
                            onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Method</label>
                        <select
                            value={filters.method}
                            onChange={(e) => setFilters({ ...filters, method: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                        >
                            <option value="All">All Methods</option>
                            <option>UPI</option>
                            <option>Bank Transfer</option>
                            <option>Cash</option>
                            <option>Card</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                        >
                            <option value="All">All Status</option>
                            <option value="Completed">Completed</option>
                            <option value="Pending">Pending</option>
                        </select>
                    </div>
                    <div className="flex items-end gap-2 col-span-1 sm:col-span-2 lg:col-span-1">
                        <button
                            onClick={exportToExcel}
                            className="flex-[3] py-3 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            XLSX
                        </button>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setFilters({ method: 'All', status: 'All', fromDate: '', toDate: '' });
                            }}
                            className="flex-1 py-3 bg-gray-100 text-gray-400 rounded-xl text-[10px] font-bold hover:bg-gray-200 hover:text-gray-600 transition-all uppercase tracking-tighter"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[24px] sm:rounded-2xl shadow-sm overflow-hidden">
                <div className="hidden lg:block">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Intern Identity</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Timestamp</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Method</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Ref ID</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <div className="flex justify-center">
                                            <div className="w-8 h-8 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        Ecosystem standby: No payments found.
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-800 uppercase text-xs">{payment.interns?.full_name || 'System Managed'}</div>
                                            <div className="text-[10px] text-gray-400 font-bold">{payment.interns?.email}</div>
                                        </td>
                                        <td className="px-6 py-4 font-black text-gray-800">₹{(payment.amount || 0).toLocaleString('en-IN')}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                                            {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-gray-400">{payment.payment_method || '-'}</td>
                                        <td className="px-6 py-4 text-[10px] text-brand-purple font-mono font-bold tracking-tighter">{payment.transaction_id || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-[10px] font-black rounded-lg ${payment.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}>
                                                {payment.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenEdit(payment)}
                                                    className="p-2 text-gray-300 hover:text-brand-purple transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePayment(payment)}
                                                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="lg:hidden divide-y divide-gray-100">
                    {loading ? (
                        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-purple" /></div>
                    ) : filteredPayments.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 font-bold text-xs uppercase tracking-widest opacity-50">No Payments Recorded</div>
                    ) : (
                        filteredPayments.map(payment => (
                            <div key={`mobile-${payment.id}`} className="p-4 sm:p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-gray-900 text-sm uppercase">{payment.interns?.full_name || 'System Managed'}</div>
                                        <div className="text-[10px] text-gray-400 font-bold">{payment.interns?.email}</div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wide border ${payment.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                        {payment.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end border-t border-gray-50 pt-4">
                                    <div>
                                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Amount Paid</div>
                                        <div className="text-lg font-black text-gray-900">₹{payment.amount?.toLocaleString('en-IN')}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Date</div>
                                        <div className="text-[11px] font-bold text-gray-600">{new Date(payment.payment_date).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-2 border-t border-gray-50 pt-4">
                                    <div className="text-[10px] font-mono font-bold text-brand-purple bg-brand-purple/5 px-2 py-1 rounded-lg truncate max-w-[150px]">
                                        {payment.transaction_id || 'INTERNAL'}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenEdit(payment)} className="p-2 text-gray-400 hover:text-brand-purple bg-gray-50 rounded-xl"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeletePayment(payment)} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Record Payment Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="p-10 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-blue-50">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-800 tracking-tight">{editingId ? 'Modify Ledger Entry' : 'Record Financial Pulse'}</h2>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">{editingId ? 'Updating training states' : 'Syncing with Training Roster'}</p>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm">
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleRecordPayment} className="p-10 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Intern</label>
                                    <select
                                        required
                                        value={formData.intern_id}
                                        onChange={(e) => setFormData({ ...formData, intern_id: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 font-bold text-gray-700"
                                    >
                                        <option value="">Select Identity</option>
                                        {interns.map(i => (
                                            <option key={i.id} value={i.id}>{i.full_name} ({i.email})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Volume (₹)</label>
                                        <input
                                            required
                                            type="number"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 font-black text-gray-800"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</label>
                                        <input
                                            required
                                            type="date"
                                            value={formData.payment_date}
                                            onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 font-bold text-gray-700"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gateway</label>
                                        <select
                                            value={formData.payment_method}
                                            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 font-bold text-gray-700"
                                        >
                                            <option>UPI</option>
                                            <option>Bank Transfer</option>
                                            <option>Cash</option>
                                            <option>Card</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference Code</label>
                                        <input
                                            type="text"
                                            value={formData.transaction_id}
                                            onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 font-mono text-xs font-bold text-brand-purple"
                                            placeholder="UTR / Ref No."
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 px-8 py-5 border border-gray-100 rounded-[24px] text-xs font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-[2] px-8 py-5 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-[24px] text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingId ? <Edit2 className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                                        {submitting ? 'SYNCING...' : editingId ? 'UPDATE TRANSACTION' : 'COMMIT TRANSACTION'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
