import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";

import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/cinzel/500.css";
import "@fontsource/cinzel/700.css";
import "@fontsource/cinzel/900.css";

import "./index.css";
import App from "./App.tsx";
import UserContextProvider from "./components/user/UserContextProvider.tsx";
import { registerAuthInterceptor } from "./api/authInterceptor";

registerAuthInterceptor();

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ReactQueryDevtools initialIsOpen={false} />
    <UserContextProvider>
      <App />
      <Toaster
        toastOptions={{
          style: { background: "#1b1a17", color: "#ece6d8", border: "1px solid #33302a" },
        }}
      />
    </UserContextProvider>
  </QueryClientProvider>
);
