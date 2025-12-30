import Navbar from '../../../components/Navbar';
import BookingModal from '../../../components/BookingModal';

export default function SiteLayout({ children }) {
  return (
    <>
      <Navbar />
      <BookingModal />
      {children}
    </>
  );
}
