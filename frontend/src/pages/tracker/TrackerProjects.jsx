import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Filter, Briefcase, Calendar, DollarSign, Edit2, Trash2, X, Loader2, RefreshCcw, CreditCard, TrendingUp, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

export default function TrackerProjects() {
    const [projects, setProjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    // Filter State
    const [filters, setFilters] = useState({
        domain: 'All',
        status: 'All',
        fromDate: '',
        toDate: ''
    });

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        client_id: '',
        domain: 'Web Development',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        value: 0,
        paid_amount: 0,
        status: 'In Progress',
        description: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        await Promise.all([fetchProjects(), fetchClients()]);
        setLoading(false);
    };

    const fetchProjects = async () => {
        try {
            const { data, error } = await supabase
                .from('tracker_projects')
                .select(`
                    *,
                    clients (company_name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const fetchClients = async () => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('id, company_name')
                .order('company_name');

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const handleOpenAdd = () => {
        setEditingId(null);
        setFormData({
            title: '',
            client_id: clients[0]?.id || '',
            domain: 'Web Development',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            value: 0,
            paid_amount: 0,
            status: 'In Progress',
            description: ''
        });
        setShowAddModal(true);
    };

    const handleOpenEdit = (project) => {
        setEditingId(project.id);
        setFormData({
            title: project.title || '',
            client_id: project.client_id || '',
            domain: project.domain || 'Web Development',
            start_date: project.start_date || '',
            end_date: project.end_date || '',
            value: project.value || 0,
            paid_amount: project.paid_amount || 0,
            status: project.status || 'In Progress',
            description: project.description || ''
        });
        setShowAddModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const dataToSubmit = {
            ...formData,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            description: formData.description?.trim() || null,
            client_id: formData.client_id || null
        };

        try {
            let result;
            if (editingId) {
                result = await supabase
                    .from('tracker_projects')
                    .update(dataToSubmit)
                    .eq('id', editingId)
                    .select();
                if (result.error) throw result.error;
            } else {
                result = await supabase
                    .from('tracker_projects')
                    .insert([dataToSubmit])
                    .select();
                if (result.error) throw result.error;
            }

            // REVOLUTIONARY SYNC: Automatically ensure Client Payments ledger and Dashboard are updated
            const projectId = editingId || result.data[0].id;
            const clientId = dataToSubmit.client_id;

            // Only sync if there's a client attached (required for ledger)
            if (clientId) {
                const transactionId = `PROJECT_INIT_${projectId}`;

                const { data: existingPayment } = await supabase
                    .from('payments')
                    .select('id')
                    .eq('project_id', projectId)
                    .eq('transaction_id', transactionId)
                    .single();

                if (dataToSubmit.paid_amount > 0) {
                    if (existingPayment) {
                        await supabase
                            .from('payments')
                            .update({ amount: dataToSubmit.paid_amount })
                            .eq('id', existingPayment.id);
                    } else {
                        await supabase.from('payments').insert([{
                            client_id: clientId,
                            project_id: projectId,
                            amount: dataToSubmit.paid_amount,
                            payment_date: dataToSubmit.start_date || new Date().toISOString().split('T')[0],
                            payment_method: 'Bank Transfer',
                            transaction_id: transactionId,
                            status: 'Completed',
                            type: 'Project Milestone'
                        }]);
                    }
                } else if (existingPayment) {
                    // Remove if paid amount is reset to 0
                    await supabase.from('payments').delete().eq('id', existingPayment.id);
                }
            }

            setShowAddModal(false);
            fetchProjects();
        } catch (error) {
            alert('Error saving project: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const repairProjectLedger = async () => {
        setLoading(true);
        try {
            for (const project of projects) {
                if (project.paid_amount > 0 && project.client_id) {
                    const transactionId = `PROJECT_INIT_${project.id}`;
                    // ROBUST SEARCH: Find ANY existing record linked to this project
                    const { data: existingRecords } = await supabase
                        .from('payments')
                        .select('id')
                        .eq('project_id', project.id)
                        .limit(1);

                    const existing = existingRecords?.[0];

                    if (!existing) {
                        await supabase.from('payments').insert([{
                            client_id: project.client_id,
                            project_id: project.id,
                            amount: project.paid_amount,
                            payment_date: project.start_date || new Date().toISOString().split('T')[0],
                            payment_method: 'Bank Transfer',
                            transaction_id: transactionId,
                            status: 'Completed',
                            type: 'Project Milestone'
                        }]);
                    } else {
                        await supabase.from('payments').update({
                            amount: project.paid_amount,
                            payment_date: project.start_date || new Date().toISOString().split('T')[0]
                        }).eq('id', existing.id);
                    }
                }
            }
            alert('Project Ecosystem Synced! Milestone ledger is now up to date.');
            fetchProjects();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProject = async (id) => {
        if (!confirm('Are you sure you want to delete this project?')) return;
        try {
            const { error } = await supabase
                .from('tracker_projects')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchProjects();
        } catch (error) {
            alert('Error deleting project: ' + error.message);
        }
    };

    const filteredProjects = projects.filter(project => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            (project.title || '').toLowerCase().includes(query) ||
            (project.domain || '').toLowerCase().includes(query) ||
            (project.clients?.company_name || '').toLowerCase().includes(query);

        const matchesDomain = filters.domain === 'All' || project.domain === filters.domain;
        const matchesStatus = filters.status === 'All' || project.status === filters.status;

        const recordDate = project.start_date || '';
        const inFromDate = !filters.fromDate || (recordDate !== '' && recordDate >= filters.fromDate);
        const inToDate = !filters.toDate || (recordDate !== '' && recordDate <= filters.toDate);

        return Boolean(matchesSearch && matchesDomain && matchesStatus && inFromDate && inToDate);
    });

    const exportToExcel = () => {
        const dataToExport = filteredProjects.map(p => ({
            'Project Title': p.title,
            'Client': p.clients?.company_name || 'INTERNAL',
            'Domain': p.domain,
            'Value': p.value,
            'Paid': p.paid_amount,
            'Status': p.status,
            'Start Date': p.start_date
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Projects");
        XLSX.writeFile(workbook, `6ixminds_projects_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-800 tracking-tighter">{value}</h3>
                </div>
                <div className={`p-4 rounded-2xl ${color} bg-opacity-10 shadow-sm`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tighter">Project Management</h1>
                    <p className="text-gray-500 font-medium text-sm mt-1 uppercase tracking-widest opacity-60">Track and manage internal and client projects</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                        onClick={repairProjectLedger}
                        className="w-full sm:w-auto px-6 py-4 bg-white border border-gray-100 text-gray-400 rounded-2xl text-[11px] font-black hover:bg-gray-50 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                    >
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-purple' : ''}`} />
                        Sync Milestone Ledger
                    </button>
                    <button
                        onClick={handleOpenAdd}
                        className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-purple to-brand-pink text-white rounded-2xl text-[13px] font-black shadow-xl shadow-brand-purple/30 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-wider"
                    >
                        <Plus className="w-5 h-5 stroke-[3px]" />
                        New Project
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
                <StatCard title="Total Projects" value={projects.length} icon={Briefcase} color="text-brand-purple" />
                <StatCard title="In Progress" value={projects.filter(p => p.status === 'In Progress').length} icon={Briefcase} color="text-blue-500" />
                <StatCard title="Delivered" value={projects.filter(p => p.status === 'Delivered').length} icon={Briefcase} color="text-emerald-500" />
                <StatCard title="Total Collection" value={`₹${projects.reduce((acc, p) => acc + (p.paid_amount || 0), 0).toLocaleString('en-IN')}`} icon={TrendingUp} color="text-emerald-600" />
                <StatCard title="Outstanding" value={`₹${projects.reduce((acc, p) => acc + ((p.value || 0) - (p.paid_amount || 0)), 0).toLocaleString('en-IN')}`} icon={DollarSign} color="text-brand-pink" />
            </div>

            <div className="bg-white border border-gray-100 rounded-[24px] sm:rounded-[32px] p-4 sm:p-8 shadow-sm space-y-6">
                <div className="relative group">
                    <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-gray-300 group-focus-within:text-brand-purple transition-colors" />
                    <input
                        type="text"
                        placeholder="SEARCH PROJECTS..."
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
                            <option>Web Development</option>
                            <option>Embedded and IoT</option>
                            <option>PCB Design</option>
                            <option>AI Solutions</option>
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
                            <option>In Progress</option>
                            <option>Delivered</option>
                            <option>Maintenance</option>
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

            {/* Projects Table */}
            <div className="bg-white border border-gray-100 rounded-[24px] sm:rounded-[32px] shadow-sm overflow-hidden">
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Project</th>
                                <th className="px-6 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</th>
                                <th className="px-6 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Domain</th>
                                <th className="px-6 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Timeline</th>
                                <th className="px-6 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Value</th>
                                <th className="px-6 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Paid</th>
                                <th className="px-6 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-24 text-center">
                                        <Loader2 className="w-12 h-12 animate-spin text-brand-purple/20 mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredProjects.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-24 text-center text-gray-400 font-bold uppercase tracking-widest text-xs opacity-50">
                                        Zero Project Signals Detected
                                    </td>
                                </tr>
                            ) : (
                                filteredProjects.map((project) => (
                                    <tr key={project.id} className="hover:bg-gray-50/50 transition-all group">
                                        <td className="px-6 py-6 whitespace-nowrap">
                                            <div className="font-black text-gray-800 text-[15px]">{project.title}</div>
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap">
                                            <div className="text-[11px] font-black text-brand-purple bg-brand-purple/5 px-3 py-1.5 rounded-xl inline-block">
                                                {project.clients?.company_name || 'INTERNAL REPO'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap">
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-100 px-3 py-1.5 rounded-xl">
                                                {project.domain || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap">
                                            <div className="text-xs font-bold text-gray-600 flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5 text-gray-300" />
                                                    {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'TBD'}
                                                </div>
                                                {project.end_date && (
                                                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                                        <span className="font-black text-[8px] uppercase tracking-tighter bg-gray-100 px-1 rounded">END</span>
                                                        {new Date(project.end_date).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap font-mono">
                                            <div className="text-[13px] font-black text-gray-800 leading-none">₹{(project.value || 0).toLocaleString('en-IN')}</div>
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap font-mono">
                                            <div className="text-[13px] font-black text-emerald-600 leading-none">₹{(project.paid_amount || 0).toLocaleString('en-IN')}</div>
                                            <div className="w-16 h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500"
                                                    style={{ width: `${Math.min(100, ((project.paid_amount || 0) / (project.value || 1)) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap">
                                            <span className={`px-4 py-1.5 text-[9px] font-black rounded-full uppercase tracking-widest text-center shadow-sm border ${project.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                project.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    project.status === 'Maintenance' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                        'bg-gray-50 text-gray-600 border-gray-100'
                                                }`}>
                                                {project.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                                <button onClick={() => handleOpenEdit(project)} className="p-3 text-gray-400 hover:text-brand-purple hover:bg-brand-purple/5 rounded-2xl transition-all border border-transparent hover:border-brand-purple/10">
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProject(project.id)}
                                                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
                                                >
                                                    <Trash2 className="w-5 h-5" />
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
                        <div className="p-12 text-center"><Loader2 className="w-12 h-12 animate-spin text-brand-purple/20 mx-auto" /></div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs opacity-50">No Projects Found</div>
                    ) : (
                        filteredProjects.map(project => (
                            <div key={`mobile-${project.id}`} className="p-4 sm:p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="font-black text-gray-800 text-sm">{project.title}</div>
                                        <div className="text-[10px] font-black text-brand-purple bg-brand-purple/5 px-2 py-1 rounded inline-block">
                                            {project.clients?.company_name || 'INTERNAL'}
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 text-[8px] font-black rounded-full uppercase tracking-widest border ${project.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-100' : project.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                                        {project.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                    <div>
                                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Value</div>
                                        <div className="text-sm font-black text-gray-900">₹{project.value?.toLocaleString('en-IN')}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Paid</div>
                                        <div className="text-sm font-black text-emerald-600">₹{project.paid_amount?.toLocaleString('en-IN')}</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'TBD'}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenEdit(project)} className="p-2 text-gray-400 hover:text-brand-purple bg-gray-50 rounded-xl"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteProject(project.id)} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Hyper-Premium Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, y: 100, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 100, scale: 0.9 }}
                            className="bg-white rounded-[48px] shadow-2xl w-full max-w-3xl overflow-hidden border border-white/20"
                        >
                            <div className="p-6 sm:p-10 border-b border-gray-100 flex items-center justify-between bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
                                <div>
                                    <h2 className="text-2xl sm:text-4xl font-black text-gray-800 tracking-tighter">{editingId ? 'Modify Project' : 'Initiate Project'}</h2>
                                    <p className="text-[10px] text-brand-purple font-black uppercase tracking-[0.3em] mt-1 opacity-60">Lifecycle Management</p>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="p-3 sm:p-5 hover:bg-gray-100 rounded-2xl sm:rounded-[28px] transition-all group">
                                    <X className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 group-hover:text-gray-800 transition-all" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 sm:p-12 space-y-8 sm:space-y-10 overflow-y-auto max-h-[75vh]">
                                <div className="space-y-3">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2 font-mono">Section 01: Core Architecture</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-gray-50/50 rounded-[40px] border border-gray-100">
                                        <div className="md:col-span-2 space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Briefcase className="w-4 h-4 text-brand-purple" />
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Project Descriptor *</label>
                                            </div>
                                            <input
                                                required
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full px-7 py-5 bg-white border border-gray-100 rounded-[28px] focus:outline-none focus:ring-4 focus:ring-brand-purple/10 transition-all font-black text-gray-800"
                                                placeholder="e.g. Next-Gen Dashboard Engine"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Capital Source (Client)</label>
                                            <select
                                                required
                                                value={formData.client_id || ''}
                                                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                                                className="w-full px-7 py-5 bg-white border border-gray-100 rounded-[28px] focus:outline-none focus:ring-4 focus:ring-brand-purple/10 font-black text-gray-800"
                                            >
                                                <option value="">Select Entity</option>
                                                {clients.map(c => (
                                                    <option key={c.id} value={c.id}>{c.company_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Technical Domain</label>
                                            <select
                                                required
                                                value={formData.domain}
                                                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                                className="w-full px-7 py-5 bg-white border border-gray-100 rounded-[28px] focus:outline-none focus:ring-4 focus:ring-brand-purple/10 font-black text-gray-800"
                                            >
                                                <option>Web Development</option>
                                                <option>Embedded and IoT</option>
                                                <option>PCB Design</option>
                                                <option>AI Solutions</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2 font-mono">Section 02: Financial Standing</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <DollarSign className="w-4 h-4 text-brand-pink" />
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Asset Value (₹)</label>
                                            </div>
                                            <input
                                                type="number"
                                                value={formData.value}
                                                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-7 py-5 bg-gray-50 border border-transparent rounded-[28px] focus:outline-none focus:ring-4 focus:ring-brand-pink/5 font-mono font-black text-gray-800"
                                            />
                                        </div>
                                        <div className="space-y-3 border-emerald-500/20 border-2 rounded-[32px] p-2 bg-emerald-50/30">
                                            <div className="flex items-center gap-2 mb-1 px-4 pt-2">
                                                <CreditCard className="w-4 h-4 text-emerald-600" />
                                                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Paid Status (Total ₹ Collected)</label>
                                            </div>
                                            <input
                                                type="number"
                                                value={formData.paid_amount}
                                                onChange={(e) => setFormData({ ...formData, paid_amount: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-7 py-5 bg-white border border-emerald-100 rounded-[28px] focus:outline-none focus:ring-4 focus:ring-emerald-500/20 font-mono font-black text-emerald-800"
                                                placeholder="Set this to update project ledger"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2 font-mono">Section 03: Lifecycle & Logistics</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Deployment Status</label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                className="w-full px-7 py-5 bg-gray-50 border border-transparent rounded-[28px] focus:outline-none focus:ring-4 focus:ring-gray-100 font-black text-gray-800"
                                            >
                                                <option>In Progress</option>
                                                <option>Delivered</option>
                                                <option>Maintenance</option>
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Kickoff Date</label>
                                            <input
                                                type="date"
                                                value={formData.start_date}
                                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                                className="w-full px-7 py-5 bg-gray-50 border border-transparent rounded-[28px] focus:outline-none focus:ring-4 focus:ring-gray-100 font-black text-gray-800"
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Operational Notes</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full px-7 py-5 bg-gray-50 border border-transparent rounded-[28px] focus:outline-none focus:ring-4 focus:ring-gray-100 font-bold text-gray-700 min-h-[120px]"
                                                placeholder="Key objectives, milestones, or constraints..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-8 bg-gradient-to-r from-brand-purple via-brand-pink to-brand-purple bg-[length:200%_auto] animate-gradient text-white rounded-[32px] text-xl font-black shadow-2xl shadow-brand-purple/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-5 uppercase tracking-widest"
                                >
                                    {submitting ? <Loader2 className="w-8 h-8 animate-spin" /> : editingId ? <Edit2 className="w-8 h-8 stroke-[3px]" /> : <Plus className="w-8 h-8 stroke-[3px]" />}
                                    {submitting ? 'EXECUTING DATA SYNC...' : editingId ? 'SYNCHRONIZE PROJECT' : 'LAUNCH PROJECT & SYNC'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
