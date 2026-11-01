// Shown immediately while the next page's data is fetched.
export default function Loading() {
  return (
    <div className="page-enter contents" aria-busy="true" aria-label="Đang tải">
      <div className="flex flex-col gap-2">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-7 w-48" />
      </div>
      <div className="skeleton h-72" />
      <div className="skeleton h-40" />
    </div>
  );
}
