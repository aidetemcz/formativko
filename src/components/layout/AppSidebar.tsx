import { Home, Users, FileText, BookOpen, LogOut, GraduationCap, Target, Book, Layers, ScrollText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useSidebar, SidebarTrigger } from "@/components/ui/sidebar";
import { useClasses } from "@/hooks/useClasses";
import { useCourses } from "@/hooks/useCourses";
import { useGoals } from "@/hooks/useGoals";
import { useLessons } from "@/hooks/useLessons";
import { LESSONS_ENABLED } from "@/config/features";
import logoImage from "@/assets/logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  visibleWhen: "always" | "hasClasses" | "hasCourses" | "hasGoals" | "hasLessons";
}

const navItems: NavItem[] = [
  { title: "Hlavní panel", url: "/", icon: Home, visibleWhen: "always" },
  { title: "Kurzy", url: "/courses", icon: Layers, visibleWhen: "hasCourses" },
  { title: "Žáci", url: "/student-profiles", icon: Users, visibleWhen: "hasClasses" },
  { title: "Třídy", url: "/classes", icon: GraduationCap, visibleWhen: "hasClasses" },
  // Evaluations used to appear only once a lesson had been planned, which was
  // the last step of the setup. Goals are that step now, and an evaluation
  // draft never needed a lesson — it reads the course, its goals and the
  // class's proofs.
  { title: "Hodnocení", url: "/evaluations", icon: FileText, visibleWhen: "hasGoals" },
  { title: "Předměty", url: "/subjects", icon: Book, visibleWhen: "hasCourses" },
  { title: "Cíle", url: "/goals", icon: Target, visibleWhen: "hasGoals" },
  { title: "Lekce", url: "/lessons", icon: BookOpen, visibleWhen: "hasLessons" },
  { title: "RVP 2025", url: "/rvp", icon: ScrollText, visibleWhen: "always" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const { signOut } = useAuth();
  const navigate = useNavigate();

  const { data: classes = [] } = useClasses();
  const { data: courses = [] } = useCourses();
  const { data: goals = [] } = useGoals();
  const { data: lessons = [] } = useLessons();

  const visibility: Record<NavItem["visibleWhen"], boolean> = {
    always: true,
    hasClasses: classes.length > 0,
    hasCourses: courses.length > 0,
    hasGoals: goals.length > 0,
    // Never true while lesson planning is off, which is what keeps the "Lekce"
    // entry out of the menu.
    hasLessons: LESSONS_ENABLED && lessons.length > 0,
  };

  const visibleItems = navItems.filter((item) => visibility[item.visibleWhen]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <img src={logoImage} alt="Tiny logo" className={`${collapsed ? "h-8 w-8 object-contain" : "h-7"}`} />
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut}>
                  <LogOut className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>Odhlásit se</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
