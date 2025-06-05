import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConnectionStatus } from "@/components/layout/connection-status";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import ClientSelection from "@/pages/inspection/client-selection";
import BasicInfo from "@/pages/inspection/basic-info";
import TileSelection from "@/pages/inspection/tile-selection";
import NonConformities from "@/pages/inspection/non-conformities";
import Review from "@/pages/inspection/review";
import ReportSuccess from "@/pages/report-success";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/inspection/client-selection" component={ClientSelection} />
      <Route path="/inspection/basic-info" component={BasicInfo} />
      <Route path="/inspection/tile-selection" component={TileSelection} />
      <Route path="/inspection/non-conformities" component={NonConformities} />
      <Route path="/inspection/review" component={Review} />
      <Route path="/report-success" component={ReportSuccess} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="app-container">
          <ConnectionStatus />
          <Router />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
