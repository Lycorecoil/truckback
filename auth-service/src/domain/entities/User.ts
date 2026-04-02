import { randomUUID } from 'crypto';

export enum UserRole {
  ADMIN = 'ADMIN',
  EXPEDITEUR = 'EXPEDITEUR',
  TRANSPORTER = 'TRANSPORTER',
  DRIVER = 'DRIVER',
}

export interface UserProps {
  id?: string;
  tenantId: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt?: Date;
}

export class User {
  private readonly props: Required<UserProps>;

  constructor(props: UserProps) {
    this.validate(props);
    this.props = {
      id: props.id ?? randomUUID(),
      tenantId: props.tenantId,
      email: props.email,
      password: props.password,
      role: props.role,
      createdAt: props.createdAt ?? new Date(),
    };
  }

  private validate(props: UserProps): void {
    if (!props.tenantId && props.role !== UserRole.ADMIN) {
      throw new Error('Le tenantId est obligatoire.');
    }
    if (!props.password) {
      throw new Error('Le mot de passe hashé est obligatoire.');
    }
  }

  get id(): string { return this.props.id; }
  get tenantId(): string { return this.props.tenantId; }
  get email(): string { return this.props.email; }
  get password(): string { return this.props.password; }
  get role(): UserRole { return this.props.role; }
  get createdAt(): Date { return this.props.createdAt; }

  toJSON() {
    return {
      id: this.props.id,
      tenantId: this.props.tenantId,
      email: this.props.email,
      role: this.props.role,
      createdAt: this.props.createdAt,
    };
  }
}
