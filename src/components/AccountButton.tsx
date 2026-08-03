import { Link } from "react-router-dom";
import { getInitials } from "../lib/format";
import { useSession } from "../state/SessionContext";
import { PersonIcon } from "./icons";

/**
 * The single entry point into auth/settings, shared by the mobile
 * StatusBar and the desktop TopBar — guests see a generic person icon
 * (-> Sign In); signed-in members see their initials (-> Settings).
 */
export function AccountButton({ className = "" }: { className?: string }) {
  const { auth } = useSession();
  const isGuest = !auth.signedIn;

  return (
    <Link
      to={isGuest ? "/sign-in" : "/settings"}
      aria-label={isGuest ? "Sign in" : "Account settings"}
      className={`flex items-center justify-center overflow-hidden rounded-full border border-line bg-card text-ink no-underline ${className}`}
    >
      {isGuest ? (
        <PersonIcon />
      ) : (
        <span className="font-sans text-[10px] font-bold">
          {getInitials(auth.name, auth.contact)}
        </span>
      )}
    </Link>
  );
}
