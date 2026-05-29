import Swal from "sweetalert2";

type ConfirmDialogOptions = {
  title: string;
  text?: string;
  confirmText: string;
  cancelText: string;
  isDark?: boolean;
};

export async function confirmDialog(
  options: ConfirmDialogOptions
): Promise<boolean> {
  const isDark = options.isDark ?? false;

  const result = await Swal.fire({
    title: options.title,
    text: options.text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: options.confirmText,
    cancelButtonText: options.cancelText,
    reverseButtons: true,
    focusCancel: true,
    buttonsStyling: true,
    confirmButtonColor: isDark ? "#86efac" : "#15803d",
    cancelButtonColor: isDark ? "#3f3f46" : "#e4e4e7",
    background: isDark ? "#0c0c0c" : "#ffffff",
    color: isDark ? "#fafafa" : "#171717",
    customClass: {
      popup: "rounded-xl border border-foreground/10 shadow-xl",
      title: "text-lg font-semibold",
      htmlContainer: "text-sm text-foreground/70",
      confirmButton: "rounded-md px-4 py-2 text-sm font-medium",
      cancelButton: "rounded-md px-4 py-2 text-sm font-medium",
    },
  });

  return result.isConfirmed;
}

type AlertDialogOptions = {
  title: string;
  text?: string;
  confirmText?: string;
  icon?: "success" | "error" | "info" | "warning";
  isDark?: boolean;
  timer?: number;
};

export async function alertDialog(options: AlertDialogOptions): Promise<void> {
  const isDark = options.isDark ?? false;

  await Swal.fire({
    title: options.title,
    text: options.text,
    icon: options.icon ?? "success",
    confirmButtonText: options.confirmText ?? "OK",
    timer: options.timer,
    timerProgressBar: options.timer != null,
    buttonsStyling: true,
    confirmButtonColor: isDark ? "#86efac" : "#15803d",
    background: isDark ? "#0c0c0c" : "#ffffff",
    color: isDark ? "#fafafa" : "#171717",
    customClass: {
      popup: "rounded-xl border border-foreground/10 shadow-xl",
      title: "text-lg font-semibold",
      htmlContainer: "text-sm text-foreground/70",
      confirmButton: "rounded-md px-4 py-2 text-sm font-medium",
    },
  });
}
