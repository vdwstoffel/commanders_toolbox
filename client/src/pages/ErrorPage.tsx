import Navbar from "@/components/ui/Navbar";
import { useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError() as { status?: number; statusText?: string; message?: string };

  return (
    <>
      <Navbar />
      <div className="relative">
        <div className="absolute text-center top-1/2 left-1/2">
          <h1>Oops!</h1>
          <p>Sorry, an unexpected error has occurred.</p>
          <p className="flex gap-2 content-center justify-center">
            <i className="font-bold">{error.status}:</i>
            <i>{error.statusText || error.message}</i>
          </p>
        </div>
      </div>
    </>
  );
}
