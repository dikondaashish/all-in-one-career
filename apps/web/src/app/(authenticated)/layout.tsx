'use client';

import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <Sidebar />
      <Topbar />
      <main className="ml-60 pt-18 min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
