import { NavLink, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NavItem = ({ to, icon, label, end: endProp }) => (
  <NavLink
    to={to}
    end={endProp}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-indigo-600 text-white'
          : 'text-gray-400 hover:text-white hover:bg-white/10'
      }`
    }
  >
    <span>{icon}</span>
    <span>{label}</span>
  </NavLink>
);

const Sidebar = () => {
  const { id: auctionId } = useParams();
  const { isAdmin, isTeamOwner } = useAuth();

  return (
    <aside className='w-56 flex-shrink-0 hidden md:flex flex-col gap-1 p-3 border-r border-gray-800'>
      <NavItem to='/' icon='🏠' label='Auctions' end />
      {isAdmin && <NavItem to='/admin/approvals' icon='✅' label='Approvals' end />}
      {isAdmin && <NavItem to='/admin/sport-templates' icon='🎮' label='Sport Templates' end />}

      {auctionId && (
        <>
          <div className='text-xs text-gray-600 uppercase tracking-wider px-3 pt-3 pb-1'>Current Auction</div>
          <NavItem to={`/auction/${auctionId}`} icon='⚡' label='Live Room' />
          <NavItem to={`/auction/${auctionId}/players`} icon='👤' label='Players' />
          <NavItem to={`/auction/${auctionId}/teams`} icon='🛡️' label='Teams' />
          {isAdmin && <NavItem to={`/auction/${auctionId}/config`} icon='⚙️' label='Config' />}
          {isTeamOwner && <NavItem to={`/auction/${auctionId}/my-squad`} icon='📋' label='My Squad' end />}
          {(isAdmin || isTeamOwner) && <NavItem to={`/auction/${auctionId}/report`} icon='📊' label='Report' />}
        </>
      )}
    </aside>
  );
};

export default Sidebar;
