export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class UserAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`Un utilisateur avec l'email "${email}" existe déjà.`);
    this.name = 'UserAlreadyExistsError';
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Email ou mot de passe incorrect.');
    this.name = 'InvalidCredentialsError';
  }
}

export class UserNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Utilisateur introuvable : ${id}`);
    this.name = 'UserNotFoundError';
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Accès non autorisé.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
