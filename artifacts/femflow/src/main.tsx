import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import { applyTheme } from "@/hooks/use-theme";

const storedTheme = localStorage.getItem("femflow_theme");
applyTheme(storedTheme === "dark" ? "dark" : "light");

setBaseUrl("/api");
setAuthTokenGetter(() => localStorage.getItem("femflow_token"));

createRoot(document.getElementById("root")!).render(<App />);
