import { SetMetadata } from "@nestjs/common";
import type { UserTier } from "@xidoke/types";

export const ROLES_KEY = "roles";
export const Roles = (...roles: UserTier[]) => SetMetadata(ROLES_KEY, roles);
