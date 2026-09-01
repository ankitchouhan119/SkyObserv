import { useEffect, useState } from "react";
import { Switch, Route, useLocation, Redirect } from "wouter";
import { ApolloProvider } from "@apollo/client";
import { TamboProvider } from "@tambo-ai/react";
import { client } from "@/apollo/client";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import ServicesPage from "@/pages/ServicesPage";
import ServiceDetailPage from "@/pages/ServiceDetailPage";
import TracesPage from "@/pages/TracesPage";
import TraceDetailPage from "@/pages/TraceDetailPage";
import TopologyPage from "@/pages/TopologyPage";
import DatabasesPage from "@/pages/DatabasesPage";
import DatabaseDetailPage from "@/pages/DatabaseDetailPage";
import EndpointDetailPage from "@/pages/EndpointDetailPage";
import NotFound from "@/pages/not-found";

import { components, tools } from "@/lib/tambo";
import K8sPage from "./pages/K8sPage";
import K8sNamespaceDetailPage from "./pages/K8sNamespaceDetailPage";
import K8sPodDetailPage from "./pages/K8sPodDetailPage";
import K8sMetricDebugger from "./pages/K8sDebug";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import ProfilePage from "./pages/ProfilePage";
import DocsPage from "./pages/docs/DocsPage";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";

function isPublicPath(path: string): boolean {
  return path === "/" || path === "/login" || path.startsWith("/docs");
}

function PublicRoutes() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/docs" component={DocsPage} />
      <Route path="/docs/:topic" component={DocsPage} />
      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}

function DashboardRoutes() {
  return (
    <Switch>
      <Route path="/dashboard" component={ServicesPage} />
      <Route path="/services/:id" component={ServiceDetailPage} />
      <Route path="/traces" component={TracesPage} />
      <Route path="/traces/:id" component={TraceDetailPage} />
      <Route path="/topology" component={TopologyPage} />
      <Route path="/databases" component={DatabasesPage} />
      <Route path="/databases/:id" component={DatabaseDetailPage} />
      <Route path="/kubernetes" component={K8sPage} />
      <Route path="/kubernetes/debug" component={K8sMetricDebugger} />
      <Route path="/kubernetes/namespace/:name" component={K8sNamespaceDetailPage} />
      <Route
        path="/services/:serviceId/endpoints/:endpointId"
        component={EndpointDetailPage}
      />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/kubernetes/namespace/:name/pod/:podName" component={K8sPodDetailPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { user, authEnabled, loading: authLoading } = useAuth();
  const [tamboKey, setTamboKey] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (authEnabled && !user) {
      setTamboKey("");
      return;
    }

    fetch("/config", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setTamboKey(data.tamboApiKey))
      .catch(() => setTamboKey(""));
  }, [authLoading, authEnabled, user]);

  if (authLoading) {
    return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">Loading...</div>;
  }

  if (authEnabled && !user) {
    return <Redirect to="/login" />;
  }

  if (tamboKey === null) {
    return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">Loading...</div>;
  }

  return (
    <ApolloProvider client={client}>
      <TamboProvider apiKey={tamboKey} components={components} tools={tools}>
        <TooltipProvider>
          <DashboardRoutes />
        </TooltipProvider>
      </TamboProvider>
    </ApolloProvider>
  );
}

function AppShell() {
  const [location] = useLocation();
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">Loading...</div>;
  }

  if (isPublicPath(location)) {
    return (
      <>
        <PublicRoutes />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <AuthenticatedApp />
      <Toaster />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
