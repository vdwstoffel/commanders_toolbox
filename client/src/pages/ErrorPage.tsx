import Navbar from "@/components/ui/Navbar";
import { useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError() as { status?: number; statusText?: string; message?: string };

  return (
    <>
      <Navbar />
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-5xl text-primary">Oops!</h1>
        <p className="text-foreground">Sorry, an unexpected error has occurred.</p>
        <p className="flex gap-2 text-muted-foreground">
          <i className="font-bold">{error.status}:</i>
          <i>{error.statusText || error.message}</i>
        </p>
      </div>
    </>
  );
}
