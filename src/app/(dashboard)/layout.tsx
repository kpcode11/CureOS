export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar placeholder */}
      <aside className="w-64 bg-slate-900 text-white p-6">
        <h2 className="text-xl font-bold">Cureos</h2>
      </aside>
      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}