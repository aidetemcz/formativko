import { Book, Camera, FileText, GraduationCap, HelpCircle, Lightbulb, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useProfile } from "@/hooks/useProfile";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useOpenHowTo } from "./howToContext";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * The menu of the new version (zadání kap. 4.1). The welcome page with
 * TinyBuddy is reached through the logo and the chat icon at the top right,
 * not through a menu entry.
 */
const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Vaše výuka",
    items: [
      { title: "Předměty", url: "/predmety", icon: Book },
      { title: "Třídy", url: "/tridy", icon: GraduationCap },
    ],
  },
  {
    label: "Hodnocení",
    items: [
      { title: "Důkazy o učení", url: "/dukazy", icon: Camera },
      { title: "Nápady", url: "/napady", icon: Lightbulb },
      { title: "Hodnocení", url: "/hodnoceni", icon: FileText },
    ],
  },
];

const linkClasses =
  "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground";
const activeClasses = "bg-sidebar-accent font-medium text-sidebar-accent-foreground";

function initials(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { displayName } = useProfile();
  const openHowTo = useOpenHowTo();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="h-14 flex-row items-center justify-between border-b px-4">
        {!collapsed && (
          <Link to="/" className="text-lg font-medium text-foreground" title="Úvod">
            Tiny
          </Link>
        )}
        <SidebarTrigger className="text-subtle hover:text-foreground" />
      </SidebarHeader>

      <SidebarContent className="px-1 py-2">
        {NAV_SECTIONS.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-[0.625rem] font-medium uppercase tracking-wider text-subtle">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink to={item.url} className={linkClasses} activeClassName={activeClasses}>
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-1 border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={openHowTo} tooltip="Jak na to" className={linkClasses}>
              <HelpCircle className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Jak na to</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Profil a nastavení" className="h-auto">
              <NavLink to="/nastaveni" className={`${linkClasses} py-2`} activeClassName={activeClasses}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-medium text-brand-strong">
                  {initials(displayName)}
                </span>
                {!collapsed && (
                  <>
                    <span className="min-w-0 flex-1 truncate font-medium text-foreground">{displayName || "Profil"}</span>
                    <Settings className="h-4 w-4 shrink-0 text-subtle" />
                  </>
                )}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
