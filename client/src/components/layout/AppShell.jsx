import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const AppShell = () => (
  <div className='min-h-screen bg-gray-950 flex flex-col'>
    <Navbar />
    <div className='flex flex-1 max-w-7xl mx-auto w-full'>
      <Sidebar />
      <main className='flex-1 overflow-auto p-4 sm:p-6'>
        <Outlet />
      </main>
    </div>
  </div>
);

export default AppShell;
