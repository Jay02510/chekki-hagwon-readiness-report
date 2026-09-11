export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-brand-dark text-text-main px-6 py-10 md:px-12">
      <div className="max-w-6xl mx-auto">
        <p className="font-display font-black text-sm text-text-muted mb-8">
          Chekki<span className="text-brand-orange">ai</span> · Admin
        </p>
        {children}
      </div>
    </main>
  );
}
