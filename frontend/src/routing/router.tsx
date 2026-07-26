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
import { InterviewSessionListPage } from "../features/interviews/InterviewSessionListPage";
import { InterviewSessionWorkspace } from "../features/interviews/InterviewSessionWorkspace";
import { LearningDashboard } from "../features/learning/LearningDashboard";
import { LearningConversationWorkspace } from "../features/learning/LearningConversationWorkspace";
import { LearningDocumentWorkspace } from "../features/learning/LearningDocumentWorkspace";
import { ResumeListPage } from "../features/resumes/ResumeListPage";
import { ResumeWorkspace } from "../features/resumes/ResumeWorkspace";
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
            element: <InterviewSessionListPage />,
          },
          {
            path: "/interviews/:sessionId",
            element: <InterviewSessionWorkspace />,
          },
          {
            path: "/learning",
            element: <LearningDashboard />,
          },
          {
            path: "/learning/documents/:documentId",
            element: <LearningDocumentWorkspace />,
          },
          {
            path: "/learning/documents/:documentId/conversations/:conversationId",
            element: <LearningConversationWorkspace />,
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
