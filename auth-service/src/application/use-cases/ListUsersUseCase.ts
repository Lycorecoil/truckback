import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserRole } from '../../domain/entities/User';

export interface ListUsersQuery {
  role?: UserRole;
  tenantId?: string;
  search?: string;
}

export class ListUsersUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: ListUsersQuery) {
    const filters: { tenantId?: string; role?: UserRole } = {};
    if (query.role) filters.role = query.role;
    if (query.tenantId) filters.tenantId = query.tenantId;

    const users = await this.userRepository.findAll(filters);

    let filtered = users;
    if (query.search) {
      const q = query.search.toLowerCase();
      filtered = users.filter(u => u.email.toLowerCase().includes(q));
    }

    return filtered.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      tenantId: u.tenantId,
      createdAt: u.createdAt,
    }));
  }
}
