import { UserRole } from "../types";

export const HUST_EMAIL_DOMAIN = "@hust.edu.vn";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export function isValidHustEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return (
    normalized.endsWith(HUST_EMAIL_DOMAIN) &&
    normalized.length > HUST_EMAIL_DOMAIN.length &&
    !normalized.includes(" ")
  );
}

export function validateRegisterInput(input: RegisterInput, confirmPassword: string): string | null {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!name) return "nameRequired";
  if (!isValidHustEmail(email)) return "emailInvalid";
  if (input.password.length < 6) return "passwordTooShort";
  if (input.password !== confirmPassword) return "passwordMismatch";
  if (!input.role) return "roleRequired";
  return null;
}

export function validateLoginInput(email: string, password: string, role: UserRole): string | null {
  if (!isValidHustEmail(email)) return "emailInvalid";
  if (!password) return "loginError";
  if (!role) return "roleRequired";
  return null;
}
