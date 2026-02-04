import { Switch, Route } from "wouter";
import { ApolloProvider } from "@apollo/client";
import { client } from "@/apollo/client";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import ServicesPage from "@/pages/ServicesPage";
import ServiceDetailPage from "@/pages/ServiceDetailPage";
import TracesPage from "@/pages/TracesPage";
import TraceDetailPage from "@/pages/TraceDetailPage";
import NotFound from "@/pages/not-found";

// Placeholder for unimplemented pages
function TopologyPage() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-background text-muted-foreground">
      Topology visualization coming soon.
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={ServicesPage} />
      <Route path="/services/:id" component={ServiceDetailPage} />
      <Route path="/traces" component={TracesPage} />
      <Route path="/traces/:id" component={TraceDetailPage} />
      <Route path="/topology" component={TopologyPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ApolloProvider client={client}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </ApolloProvider>
  );
}

export default App;
