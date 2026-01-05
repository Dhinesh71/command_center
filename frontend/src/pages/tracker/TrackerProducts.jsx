import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Filter, Package, DollarSign, Edit2, Trash2, X, Loader2, FileSpreadsheet, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

export default function TrackerProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter State
    const [filters, setFilters] = useState({
        category: 'All',
        status: 'All',
        fromDate: '',
        toDate: ''
    });

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        category: 'Software',
        status: 'Active'
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            // If table doesn't exist, we'll handle it
            if (error) {
                if (error.code === 'PGRST116' || error.message.includes('not found')) {
                    setProducts([]);
                } else {
                    throw error;
                }
            } else {
                setProducts(data || []);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .insert([formData])
                .select();

            if (error) throw error;

            setShowAddModal(false);
            setFormData({
                name: '',
                description: '',
                price: 0,
                category: 'Software',
                status: 'Active'
            });
            fetchProducts();
        } catch (error) {
            alert('Error adding product: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            fetchProducts();
        } catch (error) {
            alert('Error deleting product');
        }
    };

    const filteredProducts = products.filter(product => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            (product.name || '').toLowerCase().includes(query) ||
            (product.category || '').toLowerCase().includes(query);

        const matchesCategory = filters.category === 'All' || product.category === filters.category;
        const matchesStatus = filters.status === 'All' || product.status === filters.status;

        const recordDate = product.created_at?.split('T')[0] || '';
        const inFromDate = !filters.fromDate || (recordDate !== '' && recordDate >= filters.fromDate);
        const inToDate = !filters.toDate || (recordDate !== '' && recordDate <= filters.toDate);

        return Boolean(matchesSearch && matchesCategory && matchesStatus && inFromDate && inToDate);
    });

    const exportToExcel = () => {
        const dataToExport = filteredProducts.map(p => ({
            'Product Name': p.name,
            'Category': p.category,
            'Price': p.price,
            'Status': p.status,
            'Description': p.description,
            'Created At': new Date(p.created_at).toLocaleDateString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
        XLSX.writeFile(workbook, `6ixminds_products_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-white border border-gray-100 rounded-[28px] sm:rounded-[32px] p-5 sm:p-8 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">{title}</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tighter">{value}</h3>
                </div>
                <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl ${color} bg-opacity-10 shadow-inner`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tighter">Inventory Matrix</h1>
                    <p className="text-gray-500 font-medium text-sm mt-1 uppercase tracking-widest opacity-60">Manage internal products and system offerings</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-purple to-brand-pink text-white rounded-2xl text-[13px] font-black shadow-xl shadow-brand-purple/30 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-wider"
                >
                    <Plus className="w-5 h-5 stroke-[3px]" />
                    Add Product
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <StatCard title="Inventory Size" value={products.length} icon={Package} color="text-brand-purple" />
                <StatCard title="Active Units" value={products.filter(p => p.status === 'Active').length} icon={Package} color="text-emerald-500" />
                <StatCard title="Gross Value" value={`₹${(products.reduce((s, p) => s + (p.price || 0), 0) / 1000).toFixed(1)}k`} icon={DollarSign} color="text-blue-500" />
                <StatCard title="Domain Diversity" value={new Set(products.map(p => p.category)).size} icon={Package} color="text-brand-pink" />
            </div>

            <div className="bg-white border border-gray-100 rounded-[24px] sm:rounded-[32px] p-4 sm:p-8 shadow-sm space-y-6">
                <div className="relative group">
                    <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-gray-300 group-focus-within:text-brand-purple transition-colors" />
                    <input
                        type="text"
                        placeholder="SEARCH PRODUCTS..."
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
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Category</label>
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                        >
                            <option value="All">All Categories</option>
                            <option>Software</option>
                            <option>Service</option>
                            <option>Hardware</option>
                            <option>License</option>
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
                                setFilters({ category: 'All', status: 'All', fromDate: '', toDate: '' });
                            }}
                            className="flex-1 py-3 bg-gray-100 text-gray-400 rounded-xl text-[10px] font-bold hover:bg-gray-200 hover:text-gray-600 transition-all uppercase tracking-tighter"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
                </div>
            ) : products.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-12 text-center">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-gray-800 mb-2 uppercase tracking-tighter">Depository Empty</h3>
                    <p className="text-gray-500 mb-8 font-medium">No system products or offerings detected in registry</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-8 py-4 bg-gradient-to-r from-brand-purple to-brand-pink text-white rounded-2xl text-[13px] font-black shadow-xl shadow-brand-purple/30 hover:scale-105 transition-all inline-flex items-center gap-3 uppercase tracking-widest"
                    >
                        <Plus className="w-5 h-5 stroke-[3px]" />
                        Initialize Inventory
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredProducts.map((product) => (
                        <div key={product.id} className="bg-white border border-gray-100 rounded-[28px] p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                            <div className="flex items-start justify-between mb-6">
                                <div className="p-3 bg-brand-purple/5 rounded-2xl group-hover:scale-110 transition-transform">
                                    <Package className="w-6 h-6 text-brand-purple" />
                                </div>
                                <span className="px-3 py-1 bg-gray-50 text-[10px] font-black text-gray-400 rounded-full uppercase tracking-widest">
                                    {product.category}
                                </span>
                            </div>
                            <h3 className="font-black text-gray-800 text-lg mb-1 tracking-tight group-hover:text-brand-purple transition-colors">{product.name}</h3>
                            <p className="text-xs text-gray-500 font-medium mb-6 line-clamp-2 h-8 opacity-70">{product.description}</p>
                            <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                <span className="text-xl font-black text-gray-900 tracking-tighter">₹{(product.price || 0).toLocaleString('en-IN')}</span>
                                <div className="flex gap-2">
                                    <button className="p-3 bg-gray-50 text-gray-400 hover:text-brand-purple rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDeleteProduct(product.id)} className="p-3 bg-red-50 text-red-300 hover:text-red-500 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Product Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="bg-white rounded-[32px] sm:rounded-[48px] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20"
                        >
                            <div className="p-6 sm:p-10 border-b border-gray-100 flex items-center justify-between bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tighter">System Artifact</h2>
                                    <p className="text-[10px] text-brand-purple font-black uppercase tracking-[0.3em] mt-1 opacity-60">Inventory Registration</p>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="p-4 sm:p-5 hover:bg-gray-100 rounded-2xl sm:rounded-[28px] transition-all group">
                                    <X className="w-6 h-6 text-gray-400 group-hover:text-gray-800 transition-all" />
                                </button>
                            </div>

                            <form onSubmit={handleAddProduct} className="p-6 sm:p-12 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Product Name *</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
                                        placeholder="Mobile App MVP Package"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Price (₹)</label>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
                                        >
                                            <option>Software</option>
                                            <option>Service</option>
                                            <option>Hardware</option>
                                            <option>License</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-purple/50 min-h-[80px]"
                                        placeholder="What does this product offer?"
                                    />
                                </div>

                                <div className="pt-6 flex gap-3 sm:gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 px-4 py-4 border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-[2] px-6 py-4 bg-gradient-to-r from-brand-purple to-brand-pink text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-brand-purple/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 stroke-[3px]" />}
                                        {submitting ? 'Syncing...' : 'Register Artifact'}
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
