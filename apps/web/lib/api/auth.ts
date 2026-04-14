import { apiFetch, jsonBody } from "./client";

export async function login(email: string, password: string) {
  return apiFetch<{
    accessToken: string;
    tokenType: string;
    expiresIn: string;
    user: { id: string; email: string; firstName: string; lastName: string };
  }>("/auth/login", {
    method: "POST",
    body: jsonBody({ email, password })
  });
}

