import PublicNavbar from './PublicNavbar';
import Footer from './Footer';

const PublicLayout = ({ children }) => (
  <div className='min-h-screen bg-gray-950 flex flex-col'>
    <PublicNavbar />
    <main className='flex-1'>
      {children}
    </main>
    <Footer />
  </div>
);

export default PublicLayout;
