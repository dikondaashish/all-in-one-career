import NavBar from '@/components/NavBar';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavBar />
      <div className="p-6">{children}</div>
    </>
  );
}
