export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-4 pt-5 lg:px-8 lg:pt-7">
      <div className="skeleton h-9 w-48" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
      </div>
      <div className="skeleton h-16" />
      <div className="skeleton h-16" />
      <div className="skeleton h-16" />
    </div>
  );
}
