import { MessageCircle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { HowToProvider } from "./HowTo";
import { contextFromPage } from "@/lib/buddy";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <HowToProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="min-w-0 flex-1 overflow-auto">
            <div className="flex h-14 items-center justify-between px-4 md:px-8">
              {/* On a phone the menu slides in from here. */}
              <SidebarTrigger className="md:hidden" />
              <Link
                to="/"
                // From a lesson, plan, class or pupil the new conversation starts
                // with that page as a context chip (zadání kap. 5.1). The label
                // is read on click, once the page has set its title.
                onClick={(e) => {
                  const buddyContext = contextFromPage(location.pathname, document.title);
                  if (buddyContext) {
                    e.preventDefault();
                    navigate("/", { state: { buddyContext } });
                  }
                }}
                title="TinyBuddy"
                aria-label="Otevřít TinyBuddyho"
                className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-brand-soft hover:text-brand-strong"
              >
                <MessageCircle className="h-5 w-5" />
              </Link>
            </div>
            <div className="px-4 pb-10 md:px-10">{children}</div>
          </main>
        </div>
      </SidebarProvider>
    </HowToProvider>
  );
}
