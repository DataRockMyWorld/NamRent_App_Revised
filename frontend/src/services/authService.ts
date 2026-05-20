import axios from "axios";
import { apiClient } from "./apiClient";
import type { User } from "@/types";

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

interface AcceptInvitationPayload {
  token: string;
  first_name: string;
  last_name: string;
  phone: string;
  password: string;
}

export const authService = {
  login: (data: LoginPayload) =>
    axios.post<LoginResponse>("/api/accounts/login/", data).then((r) => r.data),

  me: () => apiClient.get<User>("/accounts/me/").then((r) => r.data),

  changePassword: (data: { current_password: string; new_password: string }) =>
    apiClient.post("/accounts/change-password/", data).then((r) => r.data),

  forgotPassword: (email: string) =>
    axios.post("/api/accounts/forgot-password/", { email }).then((r) => r.data),

  resetPassword: (data: { token: string; new_password: string }) =>
    axios.post("/api/accounts/reset-password/", data).then((r) => r.data),

  acceptInvitation: (data: AcceptInvitationPayload) =>
    axios.post("/api/accounts/invitations/accept/", data).then((r) => r.data),

  getInvitation: (token: string) =>
    axios.get(`/api/accounts/invitations/${token}/`).then((r) => r.data),
};
