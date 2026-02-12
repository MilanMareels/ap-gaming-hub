import Navbar from '../components/NavBar';
import Footer from '../components/Footer';

export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
