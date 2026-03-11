import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { User, UserRole } from "../../domain/entities/User";
import { UserModel } from "../db/UserModel";

export class MongoUserRepository implements IUserRepository {
  private toDomain(data: { id: string; tenantId: string; email: string; password: string; role: string; createdAt: Date }): User {
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
    const doc = await UserModel.findOne({ id });
    return doc ? this.toDomain(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email });
    return doc ? this.toDomain(doc) : null;
  }

  async save(user: User): Promise<User> {
    const existing = await UserModel.findOne({ id: user.id });
    if (existing) {
      await UserModel.updateOne(
        { id: user.id },
        { $set: { tenantId: user.tenantId, email: user.email, password: user.password, role: user.role } },
      );
      const updated = await UserModel.findOne({ id: user.id });
      return this.toDomain(updated!);
    }
    const doc = await UserModel.create({
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      password: user.password,
      role: user.role,
      createdAt: user.createdAt,
    });
    return this.toDomain(doc);
  }

  async delete(id: string): Promise<void> {
    await UserModel.deleteOne({ id });
  }
}
