import { useContext } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider, UserContext } from "@/hooks/use-user";
import { LocaleProvider } from "@/hooks/locale-provider";
import { PreferencesProvider } from "@/hooks/use-preferences";
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
import ProfilePage from "@/pages/profile";
import RegisterPage from "@/pages/register";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const ctx = useContext(UserContext)!;
  if (ctx.isLoading) return <div className="min-h-screen bg-background" aria-busy="true" />;
  if (!ctx.user) return <Redirect to="/login" />;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route>
        <AuthGuard>
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
              <Route path="/profile" component={ProfilePage} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </AuthGuard>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LocaleProvider>
          <UserProvider>
            <PreferencesProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
            </PreferencesProvider>
          </UserProvider>
        </LocaleProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
