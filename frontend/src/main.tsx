import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./components/SharedFormControls.css";
import { AuthProvider } from "./features/auth/AuthProvider";
import { router } from "./routing/router";
import "./styles.css";
import "./features/resumes/ResumeAssessmentActionUi.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
