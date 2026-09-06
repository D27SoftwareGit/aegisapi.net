import { Switch, Route, Router as WouterRouter } from "wouter";
import { ClerkProvider } from "@clerk/clerk-react";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Security from "@/pages/Security";
import Pricing from "@/pages/Pricing";
import Download from "@/pages/Download";
import Docs from "@/pages/Docs";
import Legal from "@/pages/Legal";
import Support from "@/pages/Support";
import SignInPage from "@/pages/SignIn";
import SignUpPage from "@/pages/SignUp";
import AccountPage from "@/pages/Account";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) {
  throw new Error("VITE_CLERK_PUBLISHABLE_KEY is not set");
}

function Router() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/security" component={Security} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/download" component={Download} />
          <Route path="/docs" component={Docs} />
          <Route path="/legal" component={Legal} />
          <Route path="/support" component={Support} />
          <Route path="/sign-in" component={SignInPage} />
          <Route path="/sign-up" component={SignUpPage} />
          <Route path="/account" component={AccountPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <div className="dark">
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </div>
    </ClerkProvider>
  );
}

export default App;
