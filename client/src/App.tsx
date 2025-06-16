import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./RootLayout";
import HomePage from "./pages/HomePage";
import DecksPage from "./pages/DecksPage";
import { NewDeckForm } from "./components/decks/NewDeckForm";
import ErrorPage from "./pages/ErrorPage";
import DeckDetails from "./pages/DeckDetails";
import AuthWrapper from "./components/user/AuthWrapper";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: "/decks",
        element: (
          <AuthWrapper>
            <DecksPage />
          </AuthWrapper>
        ),
      },
      {
        path: "/decks/new-deck",
        element: (
          <div className="text-center mt-10">
            <AuthWrapper>
              <NewDeckForm />
            </AuthWrapper>
          </div>
        ),
      },
      {
        path: "/decks/:deckId",
        element: (
          <AuthWrapper>
            <DeckDetails />
          </AuthWrapper>
        ),
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
