import DashboardPage from '@/app/(dashboard)/page';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Home() {
  return (
    <MainLayout>
      <DashboardPage />
    </MainLayout>
  );
}
