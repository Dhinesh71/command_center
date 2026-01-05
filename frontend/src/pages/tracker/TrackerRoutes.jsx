import { Routes, Route, Navigate } from 'react-router-dom';
import { useTrackerAuth } from '../../contexts/TrackerAuthContext';
import TrackerLogin from './TrackerLogin';
import TrackerLayout from './TrackerLayout';
import TrackerDashboard from './TrackerDashboard';
import TrackerTraining from './TrackerTraining';
import TrackerClients from './TrackerClients';
import TrackerProducts from './TrackerProducts';
import TrackerInternPayments from './TrackerInternPayments';
import TrackerClientPayments from './TrackerClientPayments';
import TrackerRevenueLedger from './TrackerRevenueLedger';
import TrackerAnalytics from './TrackerAnalytics';
import TrackerReports from './TrackerReports';
import TrackerUsers from './TrackerUsers';
import TrackerSettings from './TrackerSettings';
import TrackerProtectedRoute from '../../components/tracker/TrackerProtectedRoute';

// Wrapper to redirect if already logged in
function LoginRoute() {
    const { user, loading } = useTrackerAuth();
    if (!loading && user) {
        return <Navigate to="/dashboard" replace />;
    }
    return <TrackerLogin />;
}

export default function TrackerRoutes() {
    return (
        <Routes>
            <Route index element={<LoginRoute />} />

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
                <div className="p-10 text-center">
                    <h1 className="text-2xl font-bold text-red-500 tracking-tighter">404 - ACCESS DENIED</h1>
                    <p className="mt-4 text-gray-500 font-medium uppercase tracking-widest text-xs">The requested terminal path does not exist</p>
                    <div className="mt-8 p-4 bg-gray-50 rounded-2xl inline-block text-left text-xs font-mono text-gray-400">
                        Path: {window.location.pathname}<br />
                        Base: /tracker
                    </div>
                </div>
            } />
        </Routes>
    );
}
