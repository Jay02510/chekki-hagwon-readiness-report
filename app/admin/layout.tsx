export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen px-4 py-8 md:px-12">
      <div className="max-w-6xl mx-auto">
        <p className="mb-6 text-[15px] font-extrabold text-ink-2">
          Chekki<span className="text-line-ink">ai</span> · Admin
        </p>
        {children}
      </div>
    </main>
  );
}
