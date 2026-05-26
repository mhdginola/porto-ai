import type { TranslationKey } from "@/lib/i18n/translations";

export type AuthFieldKey = "name" | "email" | "password" | "confirmPassword";

export type AuthFieldErrors = Partial<Record<AuthFieldKey, string>>;

type TFn = (key: TranslationKey) => string;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginForm(
  email: string,
  password: string,
  t: TFn
): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const e = email.trim();
  const p = password;

  if (!e) errors.email = t("authDemo.validation.emailRequired");
  else if (!EMAIL_RE.test(e)) errors.email = t("authDemo.validation.emailInvalid");

  if (!p) errors.password = t("authDemo.validation.passwordRequired");

  return errors;
}

export function validateSignupForm(
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
  t: TFn
): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const n = name.trim();
  const e = email.trim();
  const p = password;

  if (!n) errors.name = t("authDemo.validation.nameRequired");
  else if (n.length < 2) errors.name = t("authDemo.validation.nameMin");

  if (!e) errors.email = t("authDemo.validation.emailRequired");
  else if (!EMAIL_RE.test(e)) errors.email = t("authDemo.validation.emailInvalid");

  if (!p) errors.password = t("authDemo.validation.passwordRequired");
  else if (p.length < 6) {
    errors.password = t("authDemo.validation.passwordMin")
      .replace("{min}", "6")
      .replace("{current}", String(p.length));
  }

  if (!confirmPassword) {
    errors.confirmPassword = t("authDemo.validation.confirmRequired");
  } else if (p !== confirmPassword) {
    errors.confirmPassword = t("authDemo.passwordMismatch");
  }

  return errors;
}

export function hasFieldErrors(errors: AuthFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
