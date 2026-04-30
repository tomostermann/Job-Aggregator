export interface User {
  id: string;
  email: string;
  password: string;
  role: "user" | "admin";
  createdAt: Date;
}

export const users: User[] = [];
