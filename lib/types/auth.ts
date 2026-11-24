import type { ID, ISODateString } from "./common";

export type Role = "patient" | "doctor";

export interface User {
  id: ID;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatarUrl?: string;
  createdAt: ISODateString;
}

export interface AuthResult {
  token: string;
  user: User;
}

export interface LoginInput {
  /** Email or phone — patients here are far more likely to remember a phone. */
  identifier: string;
  password: string;
  role: Role;
}

export interface SignupInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
}
