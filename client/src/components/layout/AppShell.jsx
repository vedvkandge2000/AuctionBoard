import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

const AnimatedOutlet = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode='wait'>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18, ease: 'easeInOut' }}
        className='flex-1'
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
};

const AppShell = () => (
  <div className='min-h-screen flex flex-col' style={{ backgroundColor: 'var(--color-bg)' }}>
    <Navbar />
    <div className='flex flex-1 max-w-7xl mx-auto w-full'>
      <Sidebar />
      <main className='flex-1 overflow-auto p-4 sm:p-6'>
        <AnimatedOutlet />
      </main>
    </div>
    <Footer />
  </div>
);

export default AppShell;
