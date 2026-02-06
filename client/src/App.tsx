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

function Router() {
  return (
    <Switch>
      <Route path="/" component={ServicesPage} />
      <Route path="/services/:id" component={ServiceDetailPage} />
      <Route path="/traces" component={TracesPage} />
      <Route path="/traces/:id" component={TraceDetailPage} />
      <Route path="/topology" component={TopologyPage} />
      <Route path="/services/:serviceId/endpoints/:endpointId" component={EndpointDetailPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const tamboApiKey = "tambo_rADabnhc9UVtaxUZZrD0xmpPHnmvNjS9KYSRCmS1kIVPyGL1+TXAaoiOpspqMshPbTYyZD5O+O6FUmZDbjc4LL5RLlTPn25TWir2PA6Daz0="

  return (
    <ApolloProvider client={client}>
      <TamboProvider
        apiKey={tamboApiKey}
        components={components}
        tools={tools}
        systemPrompt={`You are a Senior SRE. 
1. Talk in Hinglish only. 
2. **STRICT RULE**: Do not ever echo or print raw JSON results from tools in the chat bubble. 
3. After calling a tool, just give a 1-line summary and show the Card. 
4. If a user asks for a date range, convert it to 'YYYY-MM-DD HHmm' for the tools.
5. If the user asks to go to a page (e.g., "Services page pe le chalo"), use the 'navigate_to_page' tool.
6. For Services: path is "/", for Traces: "/traces", for Topology: "/topology".`}>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </TamboProvider>
    </ApolloProvider>
  );
}

export default App;