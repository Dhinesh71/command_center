import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TrackerAuthProvider } from './contexts/TrackerAuthContext';

// Import all pages directly for App.jsx (Simplified structure)
import TrackerLogin from './pages/tracker/TrackerLogin';
import TrackerLayout from './pages/tracker/TrackerLayout';
import TrackerDashboard from './pages/tracker/TrackerDashboard';
import TrackerTraining from './pages/tracker/TrackerTraining';
import TrackerClients from './pages/tracker/TrackerClients';
import TrackerProducts from './pages/tracker/TrackerProducts';
import TrackerInternPayments from './pages/tracker/TrackerInternPayments';
import TrackerClientPayments from './pages/tracker/TrackerClientPayments';
import TrackerRevenueLedger from './pages/tracker/TrackerRevenueLedger';
import TrackerAnalytics from './pages/tracker/TrackerAnalytics';
import TrackerReports from './pages/tracker/TrackerReports';
import TrackerUsers from './pages/tracker/TrackerUsers';
import TrackerSettings from './pages/tracker/TrackerSettings';
import TrackerProtectedRoute from './components/tracker/TrackerProtectedRoute';
import { useTrackerAuth } from './contexts/TrackerAuthContext';

// Wrapper to redirect if already logged in
function LoginRoute() {
    const { user, loading } = useTrackerAuth();
    if (!loading && user) {
        return <Navigate to="/dashboard" replace />;
    }
    return <TrackerLogin />;
}

export default function App() {
    return (
        <Router>
            <TrackerAuthProvider>
                <Routes>
                    <Route path="/" element={<LoginRoute />} />

                    <Route element={
                        <TrackerProtectedRoute>
                            <TrackerLayout />
                        </TrackerProtectedRoute>
                    }>
                        <Route path="dashboard" element={<TrackerDashboard />} />
                        <Route path="training" element={<TrackerTraining />} />
                        <Route path="clients" element={<TrackerClients />} />
                        <Route path="products" element={<TrackerProducts />} />
                        <Route path="payments/interns" element={<TrackerInternPayments />} />
                        <Route path="payments/clients" element={<TrackerClientPayments />} />
                        <Route path="finance/ledger" element={<TrackerRevenueLedger />} />
                        <Route path="analytics" element={<TrackerAnalytics />} />
                        <Route path="reports" element={<TrackerReports />} />
                        <Route path="users" element={<TrackerUsers />} />
                        <Route path="settings" element={<TrackerSettings />} />
                    </Route>

                    <Route path="*" element={
                        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                            <div className="max-w-md w-full bg-white rounded-[32px] p-10 shadow-premium text-center">
                                <h1 className="text-6xl font-black text-brand-purple mb-4">404</h1>
                                <h2 className="text-xl font-bold text-gray-800 mb-2 uppercase tracking-tight">Access Point Not Found</h2>
                                <p className="text-gray-500 text-sm mb-8 font-medium">The terminal path you're trying to reach does not exist in our internal network.</p>
                                <div className="p-4 bg-gray-50 rounded-2xl text-left mb-8 overflow-hidden">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Debug Info</p>
                                    <p className="text-xs font-mono text-gray-600 truncate">Path: {window.location.pathname}</p>
                                    <p className="text-xs font-mono text-gray-600">Full URL: {window.location.href}</p>
                                </div>
                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="w-full bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-purple/20 hover:scale-[1.02] transition-all uppercase tracking-widest text-xs"
                                >
                                    Return to Base
                                </button>
                            </div>
                        </div>
                    } />
                </Routes>
            </TrackerAuthProvider>
        </Router>
    );
}
