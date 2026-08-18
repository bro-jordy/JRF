import type { ToastState } from "@/components/ui/Toast";

/**
 * Runs a save action with a guaranteed minimum pending duration (Supabase
 * round-trips are often fast enough that "Saving..." would otherwise flash
 * and disappear before it's perceptible), then fires a green/red toast and
 * onSuccess. Plain async function, not a hook — call it from inside a
 * component's own handler (never from inside a hook call's arguments), so
 * ref access in onSuccess (form reset, etc.) stays outside render, where
 * this project's react-hooks/refs lint rule requires it.
 */
export async function saveWithFeedback<S extends { error: string | null }>(
  action: () => Promise<S>,
  opts: {
    entity: string;
    setToast: (toast: ToastState | null) => void;
    onSuccess?: () => void;
    ms?: number;
  }
): Promise<S> {
  const [result] = await Promise.all([
    action(),
    new Promise((resolve) => setTimeout(resolve, opts.ms ?? 400)),
  ]);

  if (result.error) {
    opts.setToast({ message: `Gagal simpan ${opts.entity}`, variant: "error" });
  } else {
    opts.setToast({ message: `Sukses simpan ${opts.entity}`, variant: "success" });
    opts.onSuccess?.();
  }

  return result;
}
