
import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface MainLayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
}

const MainLayout = ({ children, fullWidth = false }: MainLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className={`flex-grow ${fullWidth ? 'px-0 max-w-full' : 'container px-4 py-6 mx-auto'}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
