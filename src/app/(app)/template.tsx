// A template (unlike a layout) is created afresh on every navigation, so the
// entrance animation replays each time the user changes tab.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter contents">{children}</div>;
}
