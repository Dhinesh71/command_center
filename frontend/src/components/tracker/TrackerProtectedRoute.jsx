import { Navigate, useLocation } from 'react-router-dom';
import { useTrackerAuth } from '../../contexts/TrackerAuthContext';

export default function TrackerProtectedRoute({ children }) {
    const { user, loading } = useTrackerAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return children;
}
