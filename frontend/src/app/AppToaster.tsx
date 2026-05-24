import { Toaster } from "sonner";
import { useSettings } from "./use-settings";

export function AppToaster() {
  const { theme } = useSettings();

  return (
    <Toaster
      richColors
      theme={theme}
      position="top-right"
      toastOptions={{
        style: {
          borderRadius: "10px",
          boxShadow: "none",
        },
      }}
    />
  );
}
