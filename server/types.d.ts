import type { SkyobservUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SkyobservUser {}
  }
}

export {};
