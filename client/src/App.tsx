import { useEffect, useState } from "react";
import { Switch, Route } from "wouter";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={ServicesPage} />
      <Route path="/services/:id" component={ServiceDetailPage} />
      <Route path="/traces" component={TracesPage} />
      <Route path="/traces/:id" component={TraceDetailPage} />
      <Route path="/topology" component={TopologyPage} />
      <Route path="/databases" component={DatabasesPage} />
      <Route path="/databases/:id" component={DatabaseDetailPage} />
      <Route path="/kubernetes" component={K8sPage} />
      <Route path="/kubernetes/namespace/:name" component={K8sNamespaceDetailPage} />
      <Route
        path="/services/:serviceId/endpoints/:endpointId"
        component={EndpointDetailPage}
      />
      {/* <Route path="/kubernetes/namespace/:ns/pod/:podName" component={K8sPodDetailPage} /> */}
      <Route path="/kubernetes/namespace/:name/pod/:podName" component={K8sPodDetailPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [tamboKey, setTamboKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/config")
      .then((res) => res.json())
      .then((data) => setTamboKey(data.tamboApiKey))
      .catch(() => setTamboKey(""));
  }, []);

  if (tamboKey === null) {
    return <div>Loading...</div>;
  }

  return (
    <ApolloProvider client={client}>
      <TamboProvider
        apiKey={tamboKey}
        components={components}
        tools={tools}
      >
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </TamboProvider>
    </ApolloProvider>
  );
}

export default App;
