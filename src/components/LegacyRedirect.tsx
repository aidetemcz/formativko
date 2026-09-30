import { Navigate, useLocation, useParams } from "react-router-dom";

/**
 * Old English URLs lead to their Czech successors. The navigation state is
 * carried along, because some screens hand their form over through it (the
 * evaluation draft, for one).
 */
export function LegacyRedirect({ to }: { to: string }) {
  const params = useParams();
  const location = useLocation();
  const target = to.replace(/:(\w+)/g, (_, name: string) => encodeURIComponent(params[name] ?? ""));
  return <Navigate to={`${target}${location.search}`} state={location.state} replace />;
}
