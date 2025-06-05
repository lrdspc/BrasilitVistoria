import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { offlineStorage } from "./lib/offline";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ClientSelection from "@/pages/ClientSelection";
import BasicInfo from "@/pages/BasicInfo";
import TileSelection from "@/pages/TileSelection";
import NonConformities from "@/pages/NonConformities";
import Review from "@/pages/Review";
import ReportSuccess from "@/pages/ReportSuccess";
import Configuracoes from "@/pages/Configuracoes";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  
  // Initialize offline storage
  useEffect(() => {
    offlineStorage.init().catch(console.error);
  }, []);

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }, []);

  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      
      {/* Inspection Flow */}
      <Route path="/inspection/client" component={ClientSelection} />
      <Route path="/inspection/basic-info" component={BasicInfo} />
      <Route path="/inspection/:id/basic-info" component={BasicInfo} />
      <Route path="/inspection/tiles" component={TileSelection} />
      <Route path="/inspection/:id/tiles" component={TileSelection} />
      <Route path="/inspection/non-conformities" component={NonConformities} />
      <Route path="/inspection/:id/non-conformities" component={NonConformities} />
      <Route path="/inspection/review" component={Review} />
      <Route path="/inspection/:id/review" component={Review} />
      <Route path="/inspection/:id/report-success" component={ReportSuccess} />

      {/* Settings */}
      <Route path="/configuracoes" component={Configuracoes} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
