import { closeMainWindow } from "@raycast/api";
import { LicenceForm } from "./licence-form";

export default function CreateLicence() {
  return <LicenceForm onSaved={() => closeMainWindow()} />;
}
