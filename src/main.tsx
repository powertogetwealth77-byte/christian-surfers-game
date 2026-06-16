import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initPwa } from "./utils/pwa";
import "./index.css";

initPwa();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
