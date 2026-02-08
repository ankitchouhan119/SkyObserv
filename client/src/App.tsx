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
import NotFound from "@/pages/not-found";
import EndpointDetailPage from "./pages/EndpointDetailPage";

import { components, tools } from "@/lib/tambo";
import DatabasesPage from "./pages/DatabasesPage";
// import "dotenv/config"

function Router() {
  return (
    <Switch>
      <Route path="/" component={ServicesPage} />
      <Route path="/services/:id" component={ServiceDetailPage} />
      <Route path="/traces" component={TracesPage} />
      <Route path="/traces/:id" component={TraceDetailPage} />
      <Route path="/topology" component={TopologyPage} />
      <Route path="/databases" component={DatabasesPage} />
      <Route path="/services/:serviceId/endpoints/:endpointId" component={EndpointDetailPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {

  const tamboApiKey = import.meta.env.VITE_TAMBO_API_KEY;
  console.log("Key Found:", !!tamboApiKey);
  
  
  return (
    <ApolloProvider client={client}>
      <TamboProvider
        apiKey={tamboApiKey}
        components={components}
        tools={tools}>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </TamboProvider>
    </ApolloProvider>
  );
}

export default App;