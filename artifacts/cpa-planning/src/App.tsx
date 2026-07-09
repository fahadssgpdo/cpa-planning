import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/hooks/use-user";
import { LocaleProvider } from "@/hooks/use-locale";
import { Layout } from "@/components/layout";

import Dashboard from "@/pages/dashboard";
import Announcements from "@/pages/announcements";
import Discussions from "@/pages/discussions";
import DiscussionDetail from "@/pages/discussion-detail";
import Inquiries from "@/pages/inquiries";
import KnowledgeBase from "@/pages/knowledge";
import FaqPage from "@/pages/faq";
import Suggestions from "@/pages/suggestions";
import AdminPage from "@/pages/admin";
import ManualPage from "@/pages/manual";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/announcements" component={Announcements} />
        <Route path="/discussions" component={Discussions} />
        <Route path="/discussions/:id" component={DiscussionDetail} />
        <Route path="/inquiries" component={Inquiries} />
        <Route path="/knowledge" component={KnowledgeBase} />
        <Route path="/faq" component={FaqPage} />
        <Route path="/suggestions" component={Suggestions} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/manual" component={ManualPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LocaleProvider>
          <UserProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </UserProvider>
        </LocaleProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
