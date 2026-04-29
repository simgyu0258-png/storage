import { DefaultSession } from "next-auth";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      departmentId: string;
      departmentName: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    departmentId: string;
    departmentName: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    departmentId: string;
    departmentName: string;
  }
}


