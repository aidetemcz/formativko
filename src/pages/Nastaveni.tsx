import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { usePageTitle } from "@/hooks/usePageTitle";
import { JCTU_LEVELS } from "@/constants/jctu";
import { LevelChip } from "@/components/shared/LevelChip";

/** Teacher's profile and the school's scale (zadání kap. 1.2, Veronika's ProfilView). */
export default function Nastaveni() {
  usePageTitle("Profil a nastavení");
  const { profile } = useProfile();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="Profil a nastavení"
          actions={
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut />
              Odhlásit se
            </Button>
          }
        />

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Učitel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{fullName || "—"}</p>
              <p className="text-muted-foreground">{profile?.email}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Škála hodnocení</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Pokrok u každého kritéria popisují čtyři kroky. Ke každému kritériu dostane žák i konkrétní znění jednotlivých kroků.
              </p>
              <ul className="space-y-2.5">
                {JCTU_LEVELS.map((l) => (
                  <li key={l.code} className="flex items-start gap-3 text-sm">
                    <LevelChip level={l.code} />
                    <span>
                      <span className="font-medium">{l.label}</span>
                      <span className="text-muted-foreground"> · „{l.pupil}“</span>
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
