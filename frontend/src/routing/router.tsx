import {
  Navigate,
  createBrowserRouter,
  type RouteObject,
} from "react-router-dom";
import { AppShell } from "../AppShell";
import {
  AuthRoute,
  RouteLoadingState,
} from "../features/auth/AuthRoute";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterPage } from "../features/auth/RegisterPage";
import { SettingsPage } from "../features/auth/SettingsPage";
import { useAuth } from "../features/auth/AuthProvider";
import { MainDashboard } from "../features/dashboard/MainDashboard";
import { ResumeListPage } from "../features/resumes/ResumeListPage";
import { ResumeWorkspace } from "../features/resumes/ResumeWorkspace";
import { DeferredFeaturePage } from "./DeferredFeaturePage";
import { RouteErrorPage } from "./RouteErrorPage";

function RootRedirect() {
  const { status } = useAuth();

  if (status === "bootstrapping") {
    return <RouteLoadingState />;
  }

  return (
    <Navigate
      to={status === "authenticated" ? "/dashboard" : "/login"}
      replace
    />
  );
}

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <RootRedirect />,
    errorElement: <RouteErrorPage />,
  },
  {
    element: <AuthRoute mode="public-only" />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
        errorElement: <RouteErrorPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
        errorElement: <RouteErrorPage />,
      },
    ],
  },
  {
    element: <AuthRoute mode="protected" />,
    children: [
      {
        element: <AppShell />,
        errorElement: <RouteErrorPage />,
        children: [
          {
            path: "/dashboard",
            element: <MainDashboard />,
          },
          {
            path: "/resumes",
            element: <ResumeListPage />,
          },
          {
            path: "/resumes/:resumeId",
            element: <ResumeWorkspace />,
          },
          {
            path: "/interviews",
            element: (
              <DeferredFeaturePage
                eyebrow="Interview preparation"
                title="Interviews"
                description="Your interview sessions will appear here when Interview Coach is connected."
                emptyMessage="No interview records are shown until this area is connected."
              />
            ),
          },
          {
            path: "/interviews/:sessionId",
            element: (
              <DeferredFeaturePage
                eyebrow="Interview preparation"
                title="Interview session"
                description="The selected interview session will appear here when record loading is active."
                emptyMessage="No questions, attempts, or sample feedback are being shown."
              />
            ),
          },
          {
            path: "/learning",
            element: (
              <DeferredFeaturePage
                eyebrow="Learning workspace"
                title="Learning"
                description="Your learning documents will appear here when the workspace is connected."
                emptyMessage="No learning documents or study records are shown until this area is connected."
              />
            ),
          },
          {
            path: "/learning/:documentId",
            element: (
              <DeferredFeaturePage
                eyebrow="Learning workspace"
                title="Learning document"
                description="The selected learning document will appear here when record loading is active."
                emptyMessage="No document text, flashcards, or sample quiz is being shown."
              />
            ),
          },
          {
            path: "/settings",
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <RouteErrorPage notFound />,
  },
];

export const router = createBrowserRouter(appRoutes);
