import { NavLink, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  UserCheck,
  Gamepad2,
  Zap,
  Users,
  Shield,
  Settings,
  ClipboardList,
  BarChart2,
  Gavel,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NavItem = ({ to, icon: Icon, label, end: endProp }) => (
  <NavLink to={to} end={endProp}>
    {({ isActive }) => (
      <motion.div
        whileHover={{ x: 3 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className='flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer relative'
        style={{
          backgroundColor: isActive ? 'var(--color-nav-active-bg)' : 'transparent',
          color: isActive ? 'var(--color-nav-text-active)' : 'var(--color-nav-text)',
          borderLeft: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-nav-hover-bg)';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Icon size={16} />
        <span>{label}</span>
      </motion.div>
    )}
  </NavLink>
);

const Sidebar = () => {
  const { id: auctionId } = useParams();
  const { isAdmin, isTeamOwner } = useAuth();

  return (
    <aside
      className='w-56 flex-shrink-0 hidden md:flex flex-col pt-0 pb-6'
      style={{
        backgroundColor: 'var(--color-nav-bg)',
        borderRight: '1px solid var(--color-sidebar-border)',
      }}
    >
      {/* Brand strip */}
      <div
        className='flex items-center gap-2.5 px-4 py-3.5 mb-1'
        style={{ borderBottom: '1px solid var(--color-sidebar-border)' }}
      >
        <div
          className='w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0'
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          <Gavel size={14} color='white' />
        </div>
        <span className='text-sm font-bold' style={{ color: 'var(--color-nav-text-active)' }}>
          AuctionBoard
        </span>
      </div>

      {/* Nav items */}
      <div className='flex flex-col gap-0.5 px-3 pt-2'>
        <NavItem to='/' icon={LayoutDashboard} label='Auctions' end />
        {isAdmin && <NavItem to='/admin/approvals' icon={UserCheck} label='Approvals' end />}
        {isAdmin && <NavItem to='/admin/sport-templates' icon={Gamepad2} label='Sport Templates' end />}

        {auctionId && (
          <>
            <div
              className='text-xs uppercase tracking-wider px-3 pt-4 pb-1.5'
              style={{ color: 'var(--color-nav-text)', opacity: 0.5, fontWeight: 600 }}
            >
              Current Auction
            </div>
            <NavItem to={`/auction/${auctionId}`} icon={Zap} label='Live Room' />
            <NavItem to={`/auction/${auctionId}/players`} icon={Users} label='Players' />
            <NavItem to={`/auction/${auctionId}/teams`} icon={Shield} label='Teams' />
            {isAdmin && <NavItem to={`/auction/${auctionId}/config`} icon={Settings} label='Config' />}
            {isTeamOwner && <NavItem to={`/auction/${auctionId}/my-squad`} icon={ClipboardList} label='My Squad' end />}
            {(isAdmin || isTeamOwner) && <NavItem to={`/auction/${auctionId}/report`} icon={BarChart2} label='Report' />}
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
