import { AuthProvider } from '@/contexts/AuthContext';

export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
