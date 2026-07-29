import Footer from '~/components/estudiantes/layout/Footer';
import TicketSupportChatbot from '~/components/estudiantes/layout/TicketSupportChatbot';
import { TourComponent } from '~/components/estudiantes/layout/TourComponent';

// Update the import path below if the file exists at a different location, for example:
import Component from './spaces';
// Or use the correct relative path based on your project structure.

export default function Page() {
  return (
    <>
      <TicketSupportChatbot />
      <TourComponent />
      <Component />
      <Footer />
    </>
  );
}
