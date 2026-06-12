export type UserRole = 'user' | 'seller' | 'admin';

export interface JwtPayload {
  id: string;
  role: UserRole;
}
