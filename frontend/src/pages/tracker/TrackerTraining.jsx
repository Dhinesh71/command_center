import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Filter, Download, Edit2, Trash2, Users, GraduationCap, X, Loader2, Phone, Hash, CreditCard, BookOpen, Mail, User, School, Calendar, RefreshCcw, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

export default function TrackerTraining() {
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Filter State
    const [filters, setFilters] = useState({
        domain: 'All',
        status: 'All',
        fromDate: '',
        toDate: ''
    });

    // Form State - All fields optional as requested
    const [formData, setFormData] = useState({
        intern_id_custom: '',
        full_name: '',
        email: '',
        phone: '',
        college: '',
        domain: 'Web Development',
        batch_name: '',
        batch_from: '',
        batch_to: '',
        status: 'Active',
        payment_status: 'Unpaid',
        total_fee: 0,
        paid_fee: 0,
        notes: ''
    });

    useEffect(() => {
        fetchInterns();
    }, []);

    const fetchInterns = async () => {
        try {
            const { data, error } = await supabase
                .from('interns')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInterns(data || []);
        } catch (error) {
            console.error('Error fetching interns:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setEditingId(null);
        setFormData({
            intern_id_custom: '',
            full_name: '',
            email: '',
            phone: '',
            college: '',
            domain: 'Web Development',
            batch_name: '',
            batch_from: '',
            batch_to: '',
            status: 'Active',
            payment_status: 'Unpaid',
            total_fee: 0,
            paid_fee: 0,
            notes: ''
        });
        setShowAddModal(true);
    };

    const handleOpenEdit = (intern) => {
        setEditingId(intern.id);
        setFormData({
            intern_id_custom: intern.intern_id_custom || '',
            full_name: intern.full_name || '',
            email: intern.email || '',
            phone: intern.phone || '',
            college: intern.college || '',
            domain: intern.domain || 'Web Development',
            batch_name: intern.batch_name || '',
            batch_from: intern.batch_name?.split(' to ')[0] || '',
            batch_to: intern.batch_name?.split(' to ')[1] || '',
            status: intern.status || 'Active',
            payment_status: intern.payment_status || 'Unpaid',
            total_fee: intern.total_fee || 0,
            paid_fee: intern.paid_fee || 0,
            notes: intern.notes || ''
        });
        setShowAddModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const batchName = (formData.batch_from && formData.batch_to)
            ? `${formData.batch_from} to ${formData.batch_to}`
            : formData.batch_name;

        const dataToSubmit = {
            ...formData,
            batch_name: batchName,
            full_name: formData.full_name.trim() === '' ? 'Unnamed Intern' : formData.full_name.trim(),
            email: formData.email.trim() === '' ? null : formData.email.trim(),
            phone: formData.phone.trim() === '' ? null : formData.phone.trim(),
            intern_id_custom: formData.intern_id_custom.trim() === '' ? null : formData.intern_id_custom.trim(),
            college: formData.college.trim() === '' ? null : formData.college.trim(),
        };
        delete dataToSubmit.batch_from;
        delete dataToSubmit.batch_to;

        try {
            let result;
            if (editingId) {
                result = await supabase
                    .from('interns')
                    .update(dataToSubmit)
                    .eq('id', editingId)
                    .select();
                if (result.error) throw result.error;
            } else {
                result = await supabase
                    .from('interns')
                    .insert([dataToSubmit])
                    .select();
                if (result.error) throw result.error;
            }

            // REVOLUTIONARY SYNC: Automatically ensure global financial ledger and dashboard are updated
            const internId = editingId || result.data[0].id;

            // Check if an initial payment already exists to avoid duplication
            const { data: existingPayment } = await supabase
                .from('payments')
                .select('id')
                .eq('intern_id', internId)
                .eq('transaction_id', 'INITIAL_ENROLLMENT')
                .single();

            if (dataToSubmit.paid_fee > 0) {
                if (existingPayment) {
                    await supabase
                        .from('payments')
                        .update({ amount: dataToSubmit.paid_fee })
                        .eq('id', existingPayment.id);
                } else {
                    await supabase.from('payments').insert([{
                        intern_id: internId,
                        amount: dataToSubmit.paid_fee,
                        payment_date: new Date().toISOString().split('T')[0],
                        payment_method: 'UPI',
                        transaction_id: 'INITIAL_ENROLLMENT',
                        status: 'Completed',
                        type: 'Internship Fee'
                    }]);
                }
            } else if (existingPayment) {
                // If fee is now 0, remove it from the ledger to maintain sync
                await supabase.from('payments').delete().eq('id', existingPayment.id);
            }

            setShowAddModal(false);
            fetchInterns();
        } catch (error) {
            alert('Error saving record: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    // AUTOMATION TOOL: Force-sync all legacy data to ensure all other sections show correct info
    const repairFinancialLedger = async () => {
        setLoading(true);
        try {
            for (const intern of interns) {
                if (intern.paid_fee > 0) {
                    const { data: existing } = await supabase
                        .from('payments')
                        .select('id')
                        .eq('intern_id', intern.id)
                        .eq('transaction_id', 'INITIAL_ENROLLMENT')
                        .single();

                    if (!existing) {
                        await supabase.from('payments').insert([{
                            intern_id: intern.id,
                            amount: intern.paid_fee,
                            payment_date: new Date().toISOString().split('T')[0],
                            payment_method: 'UPI',
                            transaction_id: 'INITIAL_ENROLLMENT',
                            status: 'Completed',
                            type: 'Internship Fee'
                        }]);
                    } else {
                        await supabase.from('payments').update({ amount: intern.paid_fee }).eq('id', existing.id);
                    }
                }
            }
            alert('Hyper-Sync Completed! All other sections are now updated.');
            fetchInterns();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteIntern = async (id) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        try {
            const { error } = await supabase.from('interns').delete().eq('id', id);
            if (error) throw error;
            fetchInterns();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const filteredInterns = interns.filter(intern => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            (intern.full_name || '').toLowerCase().includes(query) ||
            (intern.email || '').toLowerCase().includes(query) ||
            (intern.intern_id_custom || '').toLowerCase().includes(query) ||
            (intern.phone || '').toLowerCase().includes(query) ||
            (intern.domain || '').toLowerCase().includes(query) ||
            (intern.batch_name || '').toLowerCase().includes(query);

        const matchesDomain = filters.domain === 'All' || intern.domain === filters.domain;
        const matchesStatus = filters.status === 'All' || intern.status === filters.status;

        const recordDate = intern.enrollment_date || intern.created_at?.split('T')[0] || '';

        const inFromDate = !filters.fromDate || (recordDate !== '' && recordDate >= filters.fromDate);
        const inToDate = !filters.toDate || (recordDate !== '' && recordDate <= filters.toDate);

        return Boolean(matchesSearch && matchesDomain && matchesStatus && inFromDate && inToDate);
    });

    const exportToExcel = () => {
        const dataToExport = filteredInterns.map(i => ({
            'Intern ID': i.intern_id_custom || 'N/A',
            'Full Name': i.full_name,
            'Email': i.email || 'N/A',
            'Phone': i.phone || 'N/A',
            'Domain': i.domain,
            'Batch': i.batch_name || 'Individual',
            'College': i.college || 'N/A',
            'Status': i.status,
            'Payment Status': i.payment_status,
            'Total Fee': i.total_fee,
            'Paid Fee': i.paid_fee,
            'Date Created': new Date(i.created_at).toLocaleDateString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Interns");
        XLSX.writeFile(workbook, `6ixminds_training_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
                </div>
                <div className={`p-4 rounded-2xl ${color} bg-opacity-10 shadow-inner`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tighter">Unified Training Database</h1>
                    <p className="text-gray-500 font-medium text-[10px] sm:text-xs mt-1 uppercase tracking-widest opacity-60">Sixminds Labs Operations Control</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                        onClick={repairFinancialLedger}
                        className="px-6 py-4 bg-white border border-gray-100 text-gray-400 rounded-2xl text-[10px] font-black hover:bg-gray-50 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                        title="Force sync training data with financial ledger"
                    >
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-purple' : ''}`} />
                        Sync Ecosystem
                    </button>
                    <button
                        onClick={handleOpenAdd}
                        className="px-8 py-4 bg-gradient-to-r from-brand-purple to-brand-pink text-white rounded-2xl text-[12px] font-black shadow-xl shadow-brand-purple/30 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-wider whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5 stroke-[3px]" />
                        Process New Intern
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard title="Total Registry" value={interns.length} icon={Users} color="text-brand-purple" />
                <StatCard title="Live Training" value={interns.filter(i => i.status === 'Active').length} icon={BookOpen} color="text-emerald-500" />
                <StatCard title="Outstanding Fees" value={interns.filter(i => i.payment_status !== 'Paid').length} icon={CreditCard} color="text-brand-pink" />
                <StatCard title="Total Collected" value={`₹${interns.reduce((s, i) => s + (i.paid_fee || 0), 0).toLocaleString('en-IN')}`} icon={Hash} color="text-blue-500" />
            </div>

            <div className="bg-white border border-gray-100 rounded-[24px] sm:rounded-[32px] p-4 sm:p-8 shadow-sm space-y-6">
                <div className="relative group">
                    <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-gray-300 group-focus-within:text-brand-purple transition-colors" />
                    <input
                        type="text"
                        placeholder="SEARCH BY EVERYTHING..."
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
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Domain</label>
                        <select
                            value={filters.domain}
                            onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                        >
                            <option value="All">All Domains</option>
                            <option value="Web Development">Web Development</option>
                            <option value="Embedded and IoT">Embedded and IoT</option>
                            <option value="PCB Design">PCB Design</option>
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
                            <option value="Active">Active</option>
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                            <option value="Dropped">Dropped</option>
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
                                setFilters({ domain: 'All', status: 'All', fromDate: '', toDate: '' });
                            }}
                            className="flex-1 py-3 bg-gray-100 text-gray-400 rounded-xl text-[10px] font-bold hover:bg-gray-200 hover:text-gray-600 transition-all uppercase tracking-tighter"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Identification</th>
                                <th className="px-6 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Student & Contact</th>
                                <th className="px-6 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Course & Batch</th>
                                <th className="px-6 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Matrix</th>
                                <th className="px-6 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Financials</th>
                                <th className="px-6 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="6" className="py-24 text-center"><Loader2 className="w-12 h-12 animate-spin text-brand-purple/20 mx-auto" /></td></tr>
                            ) : filteredInterns.length === 0 ? (
                                <tr><td colSpan="6" className="py-24 text-center text-gray-400 font-bold uppercase tracking-widest text-xs opacity-50">Zero Records Found In Database</td></tr>
                            ) : (
                                filteredInterns.map((intern) => (
                                    <tr key={intern.id} className="hover:bg-gray-50/50 transition-all group">
                                        <td className="px-6 py-6 whitespace-nowrap">
                                            <div className="font-mono text-[11px] text-brand-purple font-black bg-brand-purple/5 border border-brand-purple/10 px-3 py-1.5 rounded-xl inline-block shadow-sm">
                                                {intern.intern_id_custom || '6ML-TBD'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap">
                                            <div className="font-black text-gray-800 text-[15px]">{intern.full_name}</div>
                                            <div className="flex flex-col gap-1 mt-1.5">
                                                <div className="text-[10px] text-gray-400 flex items-center gap-1.5 font-bold">
                                                    <Mail className="w-3 h-3 text-brand-pink" /> {intern.email || 'NO_MAIL'}
                                                </div>
                                                <div className="text-[10px] text-gray-400 flex items-center gap-1.5 font-bold">
                                                    <Phone className="w-3 h-3 text-brand-purple" /> {intern.phone || 'NO_PHONE'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap">
                                            <div className="text-sm font-black text-gray-700 bg-gray-100/50 px-2 py-1 rounded-lg inline-block mb-1">{intern.domain}</div>
                                            <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest block flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {intern.batch_name || 'Individual'}
                                            </div>
                                            <div className="text-[9px] text-gray-300 font-bold mt-1 uppercase italic">{intern.college || 'Direct Entry'}</div>
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap">
                                            <div className="flex flex-col gap-2">
                                                <span className={`px-4 py-1.5 text-[9px] font-black rounded-full uppercase tracking-widest text-center shadow-sm border ${intern.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    intern.status === 'Pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                        intern.status === 'Completed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                            'bg-gray-50 text-gray-600 border-gray-100'
                                                    }`}>
                                                    TR: {intern.status}
                                                </span>
                                                <span className={`px-4 py-1.5 text-[9px] font-black rounded-full uppercase tracking-widest text-center shadow-sm border ${intern.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    intern.payment_status === 'Partial' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                        intern.payment_status === 'Refunded' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                            'bg-red-50 text-red-600 border-red-100'
                                                    }`}>
                                                    FEE: {intern.payment_status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap font-mono">
                                            <div className="text-[11px] font-black text-gray-800">PAID: ₹{(intern.paid_fee || 0).toLocaleString('en-IN')}</div>
                                            <div className="text-[10px] font-bold text-gray-400 mt-0.5">TOTAL: ₹{(intern.total_fee || 0).toLocaleString('en-IN')}</div>
                                            <div className="w-24 h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-brand-purple to-brand-pink"
                                                    style={{ width: `${Math.min(100, ((intern.paid_fee || 0) / (intern.total_fee || 1)) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                                <button onClick={() => handleOpenEdit(intern)} className="p-3 text-gray-400 hover:text-brand-purple hover:bg-brand-purple/5 rounded-2xl transition-all border border-transparent hover:border-brand-purple/10"><Edit2 className="w-5 h-5" /></button>
                                                <button onClick={() => handleDeleteIntern(intern.id)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Hyper-Premium Dynamic Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xl">
                        <motion.div initial={{ opacity: 0, y: 100, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 100, scale: 0.9 }} className="bg-white rounded-[32px] sm:rounded-[48px] shadow-2xl w-full max-w-3xl overflow-hidden border border-white/20">
                            <div className="p-6 sm:p-10 border-b border-gray-100 flex items-center justify-between bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
                                <div>
                                    <h2 className="text-2xl sm:text-4xl font-black text-gray-800 tracking-tighter">{editingId ? 'Modify Ledger' : 'Create Registry'}</h2>
                                    <p className="text-[10px] text-brand-purple font-black uppercase tracking-[0.3em] mt-2 opacity-60">System Core Internship Management</p>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="p-3 sm:p-5 hover:bg-gray-100 rounded-2xl sm:rounded-[28px] transition-all group border border-transparent">
                                    <X className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 group-hover:text-gray-800 group-hover:rotate-90 transition-all" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 sm:p-12 space-y-8 sm:y-10 overflow-y-auto max-h-[80vh]">

                                <div className="space-y-3">
                                    <h4 className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">Section 01: Core Identity</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 p-4 sm:p-8 bg-gray-50/50 rounded-[32px] sm:rounded-[40px] border border-gray-100 shadow-inner">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Hash className="w-4 h-4 text-brand-purple" />
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Custom Intern ID</label>
                                            </div>
                                            <input type="text" value={formData.intern_id_custom} onChange={(e) => setFormData({ ...formData, intern_id_custom: e.target.value })} className="w-full px-6 py-4.5 bg-white border border-gray-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-brand-purple/10 transition-all font-mono font-black text-brand-purple placeholder:text-gray-200" placeholder="e.g. 6ML-IN-2026-001" />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <User className="w-4 h-4 text-brand-pink" />
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Full Legal Name</label>
                                            </div>
                                            <input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="w-full px-6 py-4.5 bg-white border border-gray-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-brand-purple/10 transition-all font-black text-gray-800 placeholder:text-gray-200" placeholder="Student Name" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">Section 02: Status & Domain</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <BookOpen className="w-4 h-4 text-emerald-500" />
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Training Status</label>
                                            </div>
                                            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-6 py-4.5 bg-gray-50 border border-transparent rounded-3xl focus:outline-none focus:ring-4 focus:ring-emerald-50 transition-all font-black text-gray-800">
                                                <option value="Active">Active Training</option>
                                                <option value="Pending">Pending Start</option>
                                                <option value="Completed">Course Finished</option>
                                                <option value="Dropped">Discontinued</option>
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <CreditCard className="w-4 h-4 text-orange-500" />
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Payment Standing</label>
                                            </div>
                                            <select value={formData.payment_status} onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })} className="w-full px-6 py-4.5 bg-gray-50 border border-transparent rounded-3xl focus:outline-none focus:ring-4 focus:ring-orange-50 transition-all font-black text-gray-800">
                                                <option value="Unpaid">Unpaid / Deferred</option>
                                                <option value="Partial">Partial Payment</option>
                                                <option value="Paid">Fully Paid Up</option>
                                                <option value="Refunded">Refund Issued</option>
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <GraduationCap className="w-4 h-4 text-blue-500" />
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Learning Program</label>
                                            </div>
                                            <select value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })} className="w-full px-6 py-4.5 bg-gray-50 border border-transparent rounded-3xl focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all font-black text-gray-800">
                                                <option>Web Development</option>
                                                <option>Embedded and IoT</option>
                                                <option>PCB Design</option>
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Calendar className="w-4 h-4 text-purple-500" />
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Batch Duration</label>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase ml-1">From</span>
                                                    <input type="date" value={formData.batch_from} onChange={(e) => setFormData({ ...formData, batch_from: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-50 transition-all font-bold text-gray-800 text-xs" />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase ml-1">To</span>
                                                    <input type="date" value={formData.batch_to} onChange={(e) => setFormData({ ...formData, batch_to: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-50 transition-all font-bold text-gray-800 text-xs" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">Section 03: Financial & Background</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Total Agreed Fee (₹)</label>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-400 text-sm">₹</span>
                                                <input type="number" value={formData.total_fee} onChange={(e) => setFormData({ ...formData, total_fee: parseFloat(e.target.value) || 0 })} className="w-full pl-10 pr-6 py-4.5 bg-gray-50 border border-transparent rounded-3xl focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all font-mono font-black text-gray-800" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Actual Paid Amount (₹)</label>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-emerald-600 text-sm">₹</span>
                                                <input type="number" value={formData.paid_fee} onChange={(e) => setFormData({ ...formData, paid_fee: parseFloat(e.target.value) || 0 })} className="w-full pl-10 pr-6 py-4.5 bg-emerald-50/50 border border-transparent rounded-3xl focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all font-mono font-black text-emerald-800" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <School className="w-4 h-4 text-gray-400" />
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">College / Organization</label>
                                            </div>
                                            <input type="text" value={formData.college} onChange={(e) => setFormData({ ...formData, college: e.target.value })} className="w-full px-6 py-4.5 bg-gray-50 border border-transparent rounded-3xl focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all font-black text-gray-800 placeholder:text-gray-200" placeholder="Institution Name" />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Contact Number</label>
                                            </div>
                                            <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-6 py-4.5 bg-gray-50 border border-transparent rounded-3xl focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all font-black text-gray-800 placeholder:text-gray-200" placeholder="+91" />
                                        </div>
                                        <div className="space-y-3 col-span-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Mail className="w-4 h-4 text-gray-400" />
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Official Email Address</label>
                                            </div>
                                            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-6 py-4.5 bg-gray-50 border border-transparent rounded-3xl focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all font-black text-gray-800 placeholder:text-gray-200" placeholder="student@example.com" />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" disabled={submitting} className="w-full py-7 bg-gradient-to-r from-brand-purple via-brand-pink to-brand-purple bg-[length:200%_auto] animate-gradient text-white rounded-[32px] text-xl font-black shadow-2xl shadow-brand-purple/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-5 uppercase tracking-widest">
                                    {submitting ? <Loader2 className="w-8 h-8 animate-spin" /> : editingId ? <Edit2 className="w-8 h-8 stroke-[3px]" /> : <Plus className="w-8 h-8 stroke-[3px]" />}
                                    {submitting ? 'EXECUTING DATA SYNC...' : editingId ? 'SYNCHRONIZE RECORD' : 'COMMIT ENROLLMENT'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
