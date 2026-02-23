import React from "react";
import ReactDOM from "react-dom/client";
import FilterPage from "./FilterPage";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <FilterPage />
    </BrowserRouter>
  </React.StrictMode>
);