import Footer from '~/components/estudiantes/layout/Footer';
import TicketSupportChatbot from '~/components/estudiantes/layout/TicketSupportChatbot';
import { TourComponent } from '~/components/estudiantes/layout/TourComponent';

// Update the import path below if the file exists at a different location, for example:
import Component from './spaces';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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
