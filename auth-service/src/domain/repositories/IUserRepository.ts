import { User, UserRole } from '../entities/User';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(filters?: { tenantId?: string; role?: UserRole }): Promise<User[]>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
}
