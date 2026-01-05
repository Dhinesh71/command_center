
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';

const TrackerAuthContext = createContext({});

export const useTrackerAuth = () => useContext(TrackerAuthContext);

export const TrackerAuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Auto logout on inactivity
    useEffect(() => {
        let timeout;
        const resetTimer = () => {
            clearTimeout(timeout);
            if (user) {
                timeout = setTimeout(() => {
                    signOut();
                }, 30 * 60 * 1000); // 30 minutes
            }
        };

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => document.addEventListener(event, resetTimer));
        resetTimer();

        return () => {
            clearTimeout(timeout);
            events.forEach(event => document.removeEventListener(event, resetTimer));
        };
    }, [user]);

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            navigate('/', { replace: true });
        }
    };

    const value = {
        user,
        session,
        signIn,
        signOut,
        loading
    };

    return (
        <TrackerAuthContext.Provider value={value}>
            {loading ? (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600 font-medium">Initializing Security...</p>
                    </div>
                </div>
            ) : children}
        </TrackerAuthContext.Provider>
    );
};
