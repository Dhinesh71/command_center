import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Plus, Search, Filter, Building2, Mail, Phone, Edit2, Trash2, X,
    Loader2, FileSpreadsheet, Calendar, ChevronDown, ChevronUp, Briefcase,
    CheckCircle2, AlertCircle, RefreshCcw, TrendingUp, ArrowUpRight, Layout, Layers, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

export default function TrackerClients() {
    // Data State
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [expandedClientId, setExpandedClientId] = useState(null);
    const [showClientModal, setShowClientModal] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [selectedClientForProject, setSelectedClientForProject] = useState(null);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        type: 'All',
        status: 'All',
        fromDate: '',
        toDate: ''
    });

    // Forms State
    const [clientForm, setClientForm] = useState({
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        client_type: 'Business',
        status: 'Active'
    });

    const [projectForm, setProjectForm] = useState({
        title: '',
        domain: 'Web Development',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        value: 0,
        paid_amount: 0,
        status: 'In Progress',
        description: ''
    });

    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [clientsRes, projectsRes] = await Promise.all([
                supabase.from('clients').select('*').order('created_at', { ascending: false }),
                supabase.from('tracker_projects').select('*').order('created_at', { ascending: false })
            ]);

            if (clientsRes.error) throw clientsRes.error;
            if (projectsRes.error) throw projectsRes.error;

            setClients(clientsRes.data || []);
            setProjects(projectsRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Stats Calculation ---
    const stats = {
        totalClients: clients.length,
        activeClients: clients.filter(c => c.status === 'Active').length,
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'In Progress').length,
        totalCollection: projects.reduce((acc, p) => acc + (p.paid_amount || 0), 0),
        outstanding: projects.reduce((acc, p) => acc + ((p.value || 0) - (p.paid_amount || 0)), 0)
    };

    // --- Client Logic ---

    const handleClientSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingId) {
                const { error } = await supabase.from('clients').update(clientForm).eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('clients').insert([clientForm]);
                if (error) throw error;
            }
            setShowClientModal(false);
            setEditingId(null);
            resetClientForm();
            fetchAllData();
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClient = async (id) => {
        if (!confirm('Are you sure you want to PERMANENTLY DELETE this client? This will also delete all associated PROJECTS and PAYMENTS. This action cannot be undone.')) return;
        setLoading(true);
        try {
            // 1. Delete all payments associated with this client
            const { error: paymentError } = await supabase
                .from('payments')
                .delete()
                .eq('client_id', id);
            if (paymentError) throw paymentError;

            // 2. Delete all projects associated with this client
            const { error: projectError } = await supabase
                .from('tracker_projects')
                .delete()
                .eq('client_id', id);
            if (projectError) throw projectError;

            // 3. Delete the client itself
            const { error: clientError } = await supabase
                .from('clients')
                .delete()
                .eq('id', id);
            if (clientError) throw clientError;

            fetchAllData();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Error deleting client: ' + error.message);
            setLoading(false);
        }
    };

    const resetClientForm = () => {
        setClientForm({
            company_name: '',
            contact_person: '',
            email: '',
            phone: '',
            client_type: 'Business',
            status: 'Active'
        });
    };

    // --- Project Logic ---

    const handleOpenProjectModal = (client, project = null) => {
        setSelectedClientForProject(client);
        if (project) {
            setEditingId(project.id);
            setProjectForm(project);
        } else {
            setEditingId(null);
            resetProjectForm();
        }
        setShowProjectModal(true);
    };

    const handleProjectSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const finalProjectData = {
            ...projectForm,
            client_id: selectedClientForProject.id,
            start_date: projectForm.start_date || null,
            end_date: projectForm.end_date || null
        };

        try {
            let savedProject;
            if (editingId) {
                const { data, error } = await supabase
                    .from('tracker_projects')
                    .update(finalProjectData)
                    .eq('id', editingId)
                    .select()
                    .single();
                if (error) throw error;
                savedProject = data;
            } else {
                const { data, error } = await supabase
                    .from('tracker_projects')
                    .insert([finalProjectData])
                    .select()
                    .single();
                if (error) throw error;
                savedProject = data;
            }

            await syncProjectPayment(savedProject);

            setShowProjectModal(false);
            setEditingId(null);
            resetProjectForm();
            fetchAllData();
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const syncProjectPayment = async (project) => {
        if (!project.client_id) return;

        const transactionId = `PROJECT_INIT_${project.id}`;
        const { data: existing } = await supabase
            .from('payments')
            .select('id')
            .eq('transaction_id', transactionId)
            .single();

        if (project.paid_amount > 0) {
            const paymentData = {
                client_id: project.client_id,
                project_id: project.id,
                amount: project.paid_amount,
                payment_date: project.start_date || new Date().toISOString().split('T')[0],
                status: 'Completed',
                type: 'Project Milestone',
                transaction_id: transactionId
            };

            if (existing) {
                await supabase.from('payments').update(paymentData).eq('id', existing.id);
            } else {
                await supabase.from('payments').insert([paymentData]);
            }
        } else if (existing) {
            await supabase.from('payments').delete().eq('id', existing.id);
        }
    };

    const handleDeleteProject = async (id) => {
        if (!confirm('Are you sure you want to delete this project? This will also PERMANENTLY DELETE all associated payment records and cannot be undone.')) return;
        try {
            // 1. Delete associated payments first (to satisfy Foreign Key constraints)
            const { error: paymentError } = await supabase
                .from('payments')
                .delete()
                .eq('project_id', id);

            if (paymentError) throw paymentError;

            // 2. Delete the project
            const { error } = await supabase
                .from('tracker_projects')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // 3. Refresh data
            fetchAllData();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Error deleting project: ' + error.message);
        }
    };

    const resetProjectForm = () => {
        setProjectForm({
            title: '',
            domain: 'Web Development',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            value: 0,
            paid_amount: 0,
            status: 'In Progress',
            description: ''
        });
    };

    // --- Export Logic ---
    const exportToExcel = () => {
        // Flatten data for export
        const dataToExport = [];
        filteredClients.forEach(client => {
            const clientProjects = getClientProjects(client.id);
            if (clientProjects.length > 0) {
                clientProjects.forEach(p => {
                    dataToExport.push({
                        'Client Company': client.company_name,
                        'Contact Person': client.contact_person,
                        'Type': client.client_type,
                        'Client Status': client.status,
                        'Project Title': p.title,
                        'Domain': p.domain,
                        'Status': p.status,
                        'Value': p.value,
                        'Paid': p.paid_amount,
                        'Outstanding': (p.value || 0) - (p.paid_amount || 0)
                    });
                });
            } else {
                dataToExport.push({
                    'Client Company': client.company_name,
                    'Contact Person': client.contact_person,
                    'Type': client.client_type,
                    'Client Status': client.status,
                    'Project Title': 'N/A',
                    'Domain': 'N/A',
                    'Status': 'N/A',
                    'Value': 0,
                    'Paid': 0,
                    'Outstanding': 0
                });
            }
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Clients & Projects");
        XLSX.writeFile(workbook, `6ixminds_clients_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // --- Helpers ---

    const getClientProjects = (clientId) => projects.filter(p => p.client_id === clientId);

    const filteredClients = clients.filter(client => {
        const query = searchQuery.toLowerCase();
        const clientProjects = getClientProjects(client.id);

        // 1. Search Logic: Match Client OR Project
        const matchesClientSearch =
            (client.company_name || '').toLowerCase().includes(query) ||
            (client.contact_person || '').toLowerCase().includes(query) ||
            (client.email || '').toLowerCase().includes(query);

        const matchesProjectSearch = clientProjects.some(p =>
            (p.title || '').toLowerCase().includes(query) ||
            (p.domain || '').toLowerCase().includes(query)
        );

        const matchesSearch = matchesClientSearch || matchesProjectSearch;

        // 2. Filter Logic
        const matchesType = filters.type === 'All' || client.client_type === filters.type;
        const matchesStatus = filters.status === 'All' || client.status === filters.status;

        // 3. Date Logic: Match Client Join Date OR Project Date
        let matchesDate = true;
        if (filters.fromDate || filters.toDate) {
            const from = filters.fromDate ? new Date(filters.fromDate) : new Date('2000-01-01');
            const to = filters.toDate ? new Date(filters.toDate) : new Date('2100-01-01');
            to.setHours(23, 59, 59, 999); // End of day

            const clientDate = new Date(client.created_at);
            const clientInDate = clientDate >= from && clientDate <= to;

            const hasProjectInDate = clientProjects.some(p => {
                const pDate = new Date(p.start_date || p.created_at);
                return pDate >= from && pDate <= to;
            });

            matchesDate = clientInDate || hasProjectInDate;
        }

        return matchesSearch && matchesType && matchesStatus && matchesDate;
    });

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
                    <h3 className="text-2xl font-black text-gray-800 tracking-tight">{value}</h3>
                </div>
                <div className={`p-2.5 rounded-xl ${color} bg-opacity-10`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-20">
            {/* Header & Stats */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-800 tracking-tight">Clients & Projects</h1>
                        <p className="text-gray-500 font-medium text-sm">Unified management of client relationships and project delivery</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    <StatCard title="Total Clients" value={stats.totalClients} icon={Building2} color="text-brand-purple" />
                    <StatCard title="Active Projects" value={stats.activeProjects} icon={Briefcase} color="text-blue-500" />
                    <StatCard title="Total Collection" value={`₹${stats.totalCollection.toLocaleString('en-IN')}`} icon={ArrowUpRight} color="text-emerald-600" />
                    <StatCard title="Outstanding" value={`₹${stats.outstanding.toLocaleString('en-IN')}`} icon={AlertCircle} color="text-brand-pink" />
                    <StatCard title="Active Clients" value={stats.activeClients} icon={CheckCircle2} color="text-emerald-500" />
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-gray-100 rounded-[24px] sm:rounded-[32px] p-4 sm:p-8 shadow-sm space-y-6">
                <div className="relative group">
                    <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-gray-300 group-focus-within:text-brand-purple transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by company, person, or email..."
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
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Client Type</label>
                        <select
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                        >
                            <option value="All">All Types</option>
                            <option>Startup</option>
                            <option>Business</option>
                            <option>College</option>
                            <option>Individual</option>
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
                            <option>Active</option>
                            <option>Inactive</option>
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
                                setFilters({ type: 'All', status: 'All', fromDate: '', toDate: '' });
                            }}
                            className="flex-1 py-3 bg-gray-100 text-gray-400 rounded-xl text-[10px] font-bold hover:bg-gray-200 hover:text-gray-600 transition-all uppercase tracking-tighter"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Client Directory List */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-2 gap-4">
                    <h2 className="text-lg font-black text-gray-700 tracking-tight">Client Directory</h2>
                    <button
                        onClick={() => { setEditingId(null); resetClientForm(); setShowClientModal(true); }}
                        className="w-full sm:w-auto px-6 py-3 bg-brand-purple text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-purple/30 hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-3 h-3" />
                        Add Client
                    </button>
                </div>

                {loading ? (
                    <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-brand-purple/20 mx-auto" />
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-gray-100 rounded-2xl p-12 text-center">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs opacity-50">No Clients Found</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-[24px] sm:rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50 bg-white">
                        <div className="hidden lg:block">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50/50 text-[10px] uppercase text-gray-400 font-black tracking-widest border-b border-gray-100 select-none">
                                    <tr>
                                        <th className="pl-6 pr-4 py-4 w-1/4">Client</th>
                                        <th className="px-4 py-4">Type</th>
                                        <th className="px-4 py-4">Projects</th>
                                        <th className="px-4 py-4">Revenue (Paid / Total)</th>
                                        <th className="px-4 py-4 text-center">Status</th>
                                        <th className="px-4 py-4 text-center w-24">Actions</th>
                                        <th className="px-4 py-4 text-center w-16">View</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredClients.map(client => {
                                        const clientProjects = getClientProjects(client.id);
                                        const totalValue = clientProjects.reduce((sum, p) => sum + (Number(p.value) || 0), 0);
                                        const totalPaid = clientProjects.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0);
                                        const outstanding = totalValue - totalPaid;
                                        const isExpanded = expandedClientId === client.id;

                                        const lastActivity = clientProjects.length > 0
                                            ? new Date(Math.max(...clientProjects.map(p => new Date(p.created_at || new Date())))).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                                            : 'None';

                                        return (
                                            <>
                                                {/* MASTER ROW */}
                                                <tr
                                                    key={`master-${client.id}`}
                                                    onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                                                    className={`cursor-pointer transition-all duration-200 group relative select-none
                                                    ${isExpanded ? 'bg-brand-purple/5' : 'hover:bg-gray-50/80 bg-white'}`}
                                                >
                                                    <td className="pl-6 pr-4 py-5 align-middle">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shadow-sm shrink-0
                                                            ${client.client_type === 'Startup' ? 'bg-purple-100 text-purple-600' :
                                                                    client.client_type === 'Business' ? 'bg-blue-100 text-blue-600' :
                                                                        'bg-gray-100 text-gray-600'}`}>
                                                                {client.company_name.charAt(0)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-bold text-gray-900 text-sm truncate">{client.company_name}</div>
                                                                <div className="text-[10px] font-bold text-gray-400 mt-0.5 flex items-center gap-1.5 truncate">
                                                                    {client.contact_person || 'No Owner'}
                                                                    {client.phone && <><span className="w-1 h-1 rounded-full bg-gray-300"></span><span>{client.phone}</span></>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-5 align-middle">
                                                        <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                            {client.client_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-5 align-middle">
                                                        <div className="text-[11px] font-bold text-gray-600 whitespace-nowrap">
                                                            {clientProjects.filter(p => p.status === 'In Progress').length} Active
                                                            <span className="text-gray-300 mx-1.5">•</span>
                                                            <span className="text-gray-400">{clientProjects.length} Total</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-5 align-middle">
                                                        <div className="text-[11px] font-medium whitespace-nowrap">
                                                            <span className="font-bold text-gray-900">₹{totalPaid.toLocaleString('en-IN')}</span>
                                                            <span className="text-gray-300 mx-1.5">/</span>
                                                            <span className="text-gray-400">₹{totalValue.toLocaleString('en-IN')}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-5 text-center align-middle">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide border whitespace-nowrap
                                                        ${client.status === 'Active'
                                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                                            {client.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-5 text-center align-middle">
                                                        <div className="flex items-center justify-center gap-2 relative z-20">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setEditingId(client.id);
                                                                    setClientForm(client);
                                                                    setShowClientModal(true);
                                                                }}
                                                                className="p-1.5 text-gray-400 hover:text-brand-purple hover:bg-brand-purple/10 rounded-lg transition-colors group/btn"
                                                                title="Edit Client"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    console.log('Delete clicked for client:', client.id);
                                                                    handleDeleteClient(client.id);
                                                                }}
                                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors group/btn"
                                                                title="Delete Client"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-5 text-center align-middle">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 mx-auto
                                                        ${isExpanded ? 'bg-brand-purple text-white rotate-180 shadow-md shadow-brand-purple/20' : 'bg-gray-50 text-gray-400 group-hover:bg-brand-purple/10 group-hover:text-brand-purple'}`}>
                                                            <ChevronDown className="w-4 h-4" />
                                                        </div>
                                                    </td>

                                                    {/* Active Line */}
                                                    {isExpanded && <td className="absolute left-0 top-0 bottom-0 w-1 bg-brand-purple block p-0" aria-hidden="true"></td>}
                                                </tr>

                                                {/* EXPANDED ROW */}
                                                {isExpanded && (
                                                    <tr className="bg-gray-50/50">
                                                        <td colSpan="7" className="p-0 border-t border-dashed border-gray-200">
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="p-6">
                                                                    {/* Projects Table - Single Row Layout */}
                                                                    <div className="border border-gray-200 rounded-lg overflow-x-auto bg-white">
                                                                        <table className="w-full min-w-max">
                                                                            <thead className="bg-gray-50/50 border-b border-gray-200">
                                                                                <tr>
                                                                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Project Name</th>
                                                                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Project Value</th>
                                                                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Payment Status</th>
                                                                                    <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                                                                    <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">Last Activity</th>
                                                                                    <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider w-20">Actions</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-gray-100 bg-white">
                                                                                {clientProjects.length === 0 ? (
                                                                                    <tr>
                                                                                        <td colSpan="6" className="py-12 text-center text-gray-400 text-sm font-medium">
                                                                                            No projects found
                                                                                        </td>
                                                                                    </tr>
                                                                                ) : (
                                                                                    clientProjects.map(project => {
                                                                                        const paymentPercentage = Math.min(100, ((Number(project.paid_amount) || 0) / (Number(project.value) || 1)) * 100);
                                                                                        const projectDate = project.start_date ? new Date(project.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A';

                                                                                        return (
                                                                                            <tr
                                                                                                key={project.id}
                                                                                                onClick={(e) => { e.stopPropagation(); handleOpenProjectModal(client, project); }}
                                                                                                className="group/row hover:bg-gray-50/40 transition-colors cursor-pointer"
                                                                                            >
                                                                                                {/* 1. Project Icon + Name */}
                                                                                                <td className="px-4 py-3">
                                                                                                    <div className="flex items-center gap-3">
                                                                                                        <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-500 group-hover/row:bg-brand-purple/10 group-hover/row:text-brand-purple transition-colors flex-shrink-0">
                                                                                                            <Layout className="w-4 h-4" />
                                                                                                        </div>
                                                                                                        <div className="min-w-0">
                                                                                                            <div className="font-bold text-gray-900 text-sm truncate">{project.title}</div>
                                                                                                            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{project.domain}</div>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </td>

                                                                                                {/* 2. Project Value */}
                                                                                                <td className="px-4 py-3">
                                                                                                    <div className="text-sm font-semibold text-gray-900">
                                                                                                        ₹{(Number(project.value) || 0).toLocaleString('en-IN')}
                                                                                                    </div>
                                                                                                </td>

                                                                                                {/* 3. Payment Status */}
                                                                                                <td className="px-4 py-3">
                                                                                                    <div className="flex items-center gap-3">
                                                                                                        <div className="flex-1 min-w-[120px]">
                                                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                                                <span className={`text-[10px] font-bold ${paymentPercentage === 100 ? 'text-emerald-600' : 'text-gray-600'}`}>
                                                                                                                    {Math.round(paymentPercentage)}% Paid
                                                                                                                </span>
                                                                                                            </div>
                                                                                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                                                                                <div
                                                                                                                    className={`h-full rounded-full transition-all ${paymentPercentage === 100 ? 'bg-emerald-500' : 'bg-brand-purple'}`}
                                                                                                                    style={{ width: `${paymentPercentage}%` }}
                                                                                                                ></div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        <div className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                                                                                                            ₹{(Number(project.paid_amount) || 0).toLocaleString('en-IN')}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </td>

                                                                                                {/* 4. Overall Status */}
                                                                                                <td className="px-4 py-3 text-center">
                                                                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                                                                                                    ${project.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                                                                            project.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                                                                                'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                                                                                        {project.status}
                                                                                                    </span>
                                                                                                </td>

                                                                                                {/* 5. Last Activity */}
                                                                                                <td className="px-4 py-3 text-center">
                                                                                                    <span className="text-xs font-medium text-gray-600">
                                                                                                        {projectDate}
                                                                                                    </span>
                                                                                                </td>

                                                                                                {/* 6. Actions */}
                                                                                                <td className="px-4 py-3 text-center">
                                                                                                    <div className="flex items-center justify-center gap-1.5 relative z-20">
                                                                                                        <button
                                                                                                            onClick={(e) => {
                                                                                                                e.preventDefault();
                                                                                                                e.stopPropagation();
                                                                                                                handleOpenProjectModal(client, project);
                                                                                                            }}
                                                                                                            className="p-1.5 text-gray-400 hover:text-brand-purple hover:bg-brand-purple/10 rounded transition-colors"
                                                                                                            title="Edit Project"
                                                                                                        >
                                                                                                            <Edit2 className="w-4 h-4" />
                                                                                                        </button>
                                                                                                        <button
                                                                                                            onClick={(e) => {
                                                                                                                e.preventDefault();
                                                                                                                e.stopPropagation();
                                                                                                                handleDeleteProject(project.id);
                                                                                                            }}
                                                                                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                                                            title="Delete Project"
                                                                                                        >
                                                                                                            <Trash2 className="w-4 h-4" />
                                                                                                        </button>
                                                                                                    </div>
                                                                                                </td>
                                                                                            </tr>
                                                                                        );
                                                                                    })
                                                                                )}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card List */}
                        <div className="lg:hidden divide-y divide-gray-100">
                            {filteredClients.map(client => {
                                const clientProjects = getClientProjects(client.id);
                                const totalValue = clientProjects.reduce((sum, p) => sum + (Number(p.value) || 0), 0);
                                const totalPaid = clientProjects.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0);
                                const isExpanded = expandedClientId === client.id;

                                return (
                                    <div key={`mobile-card-${client.id}`} className="p-4 sm:p-6 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shadow-sm
                                                    ${client.client_type === 'Startup' ? 'bg-purple-100 text-purple-600' :
                                                        client.client_type === 'Business' ? 'bg-blue-100 text-blue-600' :
                                                            'bg-gray-100 text-gray-600'}`}>
                                                    {client.company_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{client.company_name}</div>
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                        {client.client_type} • {clientProjects.length} Projects
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wide border
                                                ${client.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                                {client.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                            <div>
                                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Value</div>
                                                <div className="text-sm font-black text-gray-900">₹{totalValue.toLocaleString('en-IN')}</div>
                                            </div>
                                            <div>
                                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Paid Amount</div>
                                                <div className="text-sm font-black text-emerald-600">₹{totalPaid.toLocaleString('en-IN')}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <button
                                                onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                                                className="flex-1 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-gray-100"
                                            >
                                                {isExpanded ? 'Hide Projects' : 'View Projects'}
                                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingId(client.id); setClientForm(client); setShowClientModal(true); }} className="p-2.5 text-gray-400 hover:text-brand-purple bg-white border border-gray-100 rounded-xl"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteClient(client.id)} className="p-2.5 text-gray-400 hover:text-red-500 bg-white border border-gray-100 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pt-2 space-y-3">
                                                    {clientProjects.length === 0 ? (
                                                        <div className="py-8 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">No Projects Found</div>
                                                    ) : (
                                                        clientProjects.map(project => (
                                                            <div key={project.id} onClick={() => handleOpenProjectModal(client, project)} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div className="font-bold text-gray-900 text-sm">{project.title}</div>
                                                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${project.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{project.status}</span>
                                                                </div>
                                                                <div className="flex justify-between items-end">
                                                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{project.domain}</div>
                                                                    <div className="text-xs font-black text-brand-purple">₹{project.value?.toLocaleString('en-IN')}</div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Client Modal */}
            <AnimatePresence>
                {showClientModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h3 className="font-bold text-lg text-gray-800">{editingId ? 'Edit Client' : 'New Client'}</h3>
                                <button onClick={() => setShowClientModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
                            </div>
                            <form onSubmit={handleClientSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Company Name</label>
                                    <input required value={clientForm.company_name} onChange={e => setClientForm({ ...clientForm, company_name: e.target.value })} className="w-full mt-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-purple/20 font-bold text-gray-700" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Type</label>
                                        <select value={clientForm.client_type} onChange={e => setClientForm({ ...clientForm, client_type: e.target.value })} className="w-full mt-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-purple/20 font-bold text-gray-700">
                                            <option>Startup</option><option>Business</option><option>College</option><option>Individual</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Status</label>
                                        <select value={clientForm.status} onChange={e => setClientForm({ ...clientForm, status: e.target.value })} className="w-full mt-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-purple/20 font-bold text-gray-700">
                                            <option>Active</option>
                                            <option>Inactive</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contact Person</label>
                                        <input value={clientForm.contact_person} onChange={e => setClientForm({ ...clientForm, contact_person: e.target.value })} className="w-full mt-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-purple/20 font-bold text-gray-700" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Company Email</label>
                                        <input type="email" value={clientForm.email || ''} onChange={e => setClientForm({ ...clientForm, email: e.target.value })} placeholder="company@example.com" className="w-full mt-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-purple/20 font-bold text-gray-700" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Phone</label>
                                    <input value={clientForm.phone || ''} onChange={e => setClientForm({ ...clientForm, phone: e.target.value })} placeholder="+91 1234567890" className="w-full mt-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-purple/20 font-bold text-gray-700" />
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" disabled={submitting} className="flex-1 py-3 bg-brand-purple text-white rounded-xl font-bold hover:bg-brand-purple/90 transition-all flex justify-center items-center gap-2">
                                        {submitting ? <Loader2 className="animate-spin" /> : <><Edit2 className="w-4 h-4" /> Save Changes</>}
                                    </button>
                                    {editingId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (confirm('Are you sure? This will delete the client and ALL associated projects.')) {
                                                    handleDeleteClient(editingId);
                                                    setShowClientModal(false);
                                                }
                                            }}
                                            className="px-4 py-3 bg-red-50 text-red-500 rounded-xl font-bold hover:bg-red-100 transition-all"
                                            title="Delete Client"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Project Modal */}
            <AnimatePresence>
                {showProjectModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{editingId ? 'Edit Project' : 'New Project'}</h3>
                                    <p className="text-xs text-gray-500 font-medium">For client: <span className="text-brand-purple">{selectedClientForProject?.company_name}</span></p>
                                </div>
                                <button onClick={() => setShowProjectModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
                            </div>
                            <form onSubmit={handleProjectSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Project Title</label>
                                        <input required value={projectForm.title} onChange={e => setProjectForm({ ...projectForm, title: e.target.value })} className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-purple/20 font-bold text-gray-700" placeholder="e.g. E-Commerce Platform" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Domain</label>
                                        <select value={projectForm.domain} onChange={e => setProjectForm({ ...projectForm, domain: e.target.value })} className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-purple/20 font-bold text-gray-700">
                                            <option>Web Development</option><option>App Development</option><option>IoT Solutions</option><option>AI/ML</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Status</label>
                                        <select value={projectForm.status} onChange={e => setProjectForm({ ...projectForm, status: e.target.value })} className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-purple/20 font-bold text-gray-700">
                                            <option>In Progress</option><option>Delivered</option><option>On Hold</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Start Date</label>
                                        <input type="date" value={projectForm.start_date} onChange={e => setProjectForm({ ...projectForm, start_date: e.target.value })} className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-purple/20 font-bold text-gray-700" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">End Date</label>
                                        <input type="date" value={projectForm.end_date} onChange={e => setProjectForm({ ...projectForm, end_date: e.target.value })} className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-purple/20 font-bold text-gray-700" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Value (₹)</label>
                                        <input type="number" value={projectForm.value} onChange={e => setProjectForm({ ...projectForm, value: parseFloat(e.target.value) || 0 })} className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-purple/20 font-bold text-gray-700" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Paid Amount (₹)</label>
                                        <input type="number" value={projectForm.paid_amount} onChange={e => setProjectForm({ ...projectForm, paid_amount: parseFloat(e.target.value) || 0 })} className="w-full mt-1 px-4 py-3 bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-emerald-600" />
                                    </div>
                                </div>
                                <button type="submit" disabled={submitting} className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all flex justify-center uppercase tracking-widest text-sm">{submitting ? <Loader2 className="animate-spin" /> : 'Save Project & Sync Ledger'}</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
