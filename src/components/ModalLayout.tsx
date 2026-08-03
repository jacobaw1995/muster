import { Outlet } from "react-router-dom";
import { PhoneFrame } from "./PhoneFrame";

/** Layout for the auth/settings screens — no bottom tab bar. */
export function ModalLayout() {
  return (
    <PhoneFrame>
      <Outlet />
    </PhoneFrame>
  );
}
