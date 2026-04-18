import PublicNavbar from './PublicNavbar';
import Footer from './Footer';

const PublicLayout = ({ children }) => (
  <div className='min-h-screen flex flex-col' style={{ backgroundColor: 'var(--color-bg)' }}>
    <PublicNavbar />
    <main className='flex-1'>
      {children}
    </main>
    <Footer />
  </div>
);

export default PublicLayout;
