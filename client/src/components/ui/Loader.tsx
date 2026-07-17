export default function Loader() {
  return (
    <div data-testid="loader" className="flex items-center justify-center m-5">
      <div className="w-12 h-12 border-4 border-primary border-solid border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
