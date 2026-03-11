import { PrismaClient, User as PrismaUser } from '@prisma/client';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User, UserRole } from '../../domain/entities/User';

const prisma = new PrismaClient();

export class PrismaUserRepository implements IUserRepository {
  private toDomain(data: PrismaUser): User {
    return new User({
      id: data.id,
      tenantId: data.tenantId,
      email: data.email,
      password: data.password,
      role: data.role as UserRole,
      createdAt: data.createdAt,
    });
  }

  async findById(id: string): Promise<User | null> {
    const data = await prisma.user.findUnique({ where: { id } });
    return data ? this.toDomain(data) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const data = await prisma.user.findUnique({ where: { email } });
    return data ? this.toDomain(data) : null;
  }

  async save(user: User): Promise<User> {
    const existing = await prisma.user.findUnique({ where: { id: user.id } });
    const data = existing
      ? await prisma.user.update({
          where: { id: user.id },
          data: {
            tenantId: user.tenantId,
            email: user.email,
            password: user.password,
            role: user.role,
          },
        })
      : await prisma.user.create({
          data: {
            id: user.id,
            tenantId: user.tenantId,
            email: user.email,
            password: user.password,
            role: user.role,
            createdAt: user.createdAt,
          },
        });
    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }
}
