import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
/* eslint-disable-next-line no-unused-vars */
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Projects', path: '/projects' },
    { name: 'Showcase', path: '/showcase' },
    { name: 'Internships', path: '/internships' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path) => location.pathname === path;

  const navigate = useNavigate();

  const navRef = useRef(null);
  const pendingNavRef = useRef(null);

  // When location changes, if we had a pending navigation target, scroll to top
  useEffect(() => {
    if (pendingNavRef.current && pendingNavRef.current === location.pathname) {
      const html = document.documentElement;
      const prevBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      // ensure instant jump
      window.scrollTo({ top: 0, behavior: 'auto' });
      pendingNavRef.current = null;
      // restore previous value on next tick
      requestAnimationFrame(() => {
        html.style.scrollBehavior = prevBehavior || '';
      });
    }
  }, [location.pathname]);

  // Set CSS variable with header height so sections can offset correctly
  useEffect(() => {
    const setHeaderHeight = () => {
      const height = navRef.current ? navRef.current.offsetHeight : 0;
      document.documentElement.style.setProperty('--header-height', `${height}px`);
    };

    setHeaderHeight();
    window.addEventListener('resize', setHeaderHeight);
    return () => window.removeEventListener('resize', setHeaderHeight);
  }, []);

  const handleNavClick = (path, e, closeMenu = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (closeMenu) setIsOpen(false);

    const html = document.documentElement;
    const prevBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';

    if (path !== location.pathname) {
      // mark pending navigation so we scroll AFTER the route changes
      pendingNavRef.current = path;
      navigate(path);
    } else {
      // same route: immediately jump to top of page
      window.scrollTo({ top: 0, behavior: 'auto' });
    }

    // restore behavior after a tick — actual scroll happens when location updates
    requestAnimationFrame(() => {
      html.style.scrollBehavior = prevBehavior || '';
    });
  };

  return (
    <nav ref={navRef} className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" onClick={(e) => handleNavClick('/', e)} className="flex items-center space-x-3 group">
            <motion.img
              src="/logo.jpg"
              alt="6ixminds Labs logo"
              className="w-10 h-10 rounded-xl shadow-lg object-cover"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ duration: 0.2 }}
            />
            <span className="text-2xl font-bold gradient-text">6ixminds Labs</span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={(e) => handleNavClick(link.path, e)}
                className="relative px-4 py-2 text-gray-700 hover:text-brand-purple transition-colors duration-300 font-medium"
              >
                {link.name}
                {isActive(link.path) && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-purple to-brand-pink"
                    initial={false}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          <div className="hidden md:block">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/verify"
                onClick={(e) => handleNavClick('/verify', e)}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-brand-purple to-brand-pink text-white font-semibold shadow-lg hover:shadow-glow transition-all duration-300"
              >
                Verify Certificate
              </Link>
            </motion.div>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={(e) => handleNavClick(link.path, e, true)}
                  className={`block px-4 py-3 rounded-xl transition-all ${isActive(link.path)
                    ? 'bg-gradient-to-r from-brand-purple/10 to-brand-pink/10 text-brand-purple font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                to="/verify"
                onClick={(e) => handleNavClick('/verify', e, true)}
                className="block px-4 py-3 bg-gradient-to-r from-brand-purple to-brand-pink text-white rounded-xl text-center font-semibold shadow-lg"
              >
                Verify Certificate
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
