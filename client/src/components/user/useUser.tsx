import { useContext } from "react";
import { UserContext } from "./UserContextProvider";

export function useUser() {
  const context = useContext(UserContext);

  if (context === undefined) {
    throw new Error("userUser is used outside of the provider");
  }

  return context;
}
