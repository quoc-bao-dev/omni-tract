import { Navbar } from '@/components/layout/navbar';
import { ToastContainer } from '@/components/ui/toast';
import { DashboardPage } from '@/features/dashboard';

export default function Page() {
  return (
    <>
      <Navbar />
      <DashboardPage />
      <ToastContainer />
    </>
  );
}
