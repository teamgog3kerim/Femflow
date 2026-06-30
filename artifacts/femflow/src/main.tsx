import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

setBaseUrl("/api");
setAuthTokenGetter(() => localStorage.getItem("femflow_token"));

createRoot(document.getElementById("root")!).render(<App />);
