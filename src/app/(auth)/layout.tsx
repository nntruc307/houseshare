export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-7 pt-20 pb-10">
      <div className="flex flex-col gap-2">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-brand text-brand-ink">
          <svg
            aria-hidden="true"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
          </svg>
        </span>
        <p className="mt-2 text-[30px] leading-none font-bold">Houseshare</p>
        <p className="text-[15px] text-muted">Nhà chung 42/9 Nguyễn Thái Bình</p>
        <span aria-hidden="true" className="mt-1.5 flex gap-1.5">
          {["#b4381a", "#f59e0b", "#1d7a46", "#1f5fa8", "#5b3cc4"].map((c) => (
            <span key={c} className="h-1.5 w-7 rounded-full" style={{ background: c }} />
          ))}
        </span>
      </div>
      {children}
    </main>
  );
}
