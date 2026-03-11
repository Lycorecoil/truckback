export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotificationFailedError extends DomainError {
  constructor(channel: string, reason: string) {
    super(`Échec de l'envoi de la notification ${channel} : ${reason}`);
    this.name = 'NotificationFailedError';
  }
}

export class TemplateNotFoundError extends DomainError {
  constructor(name: string) {
    super(`Template introuvable : "${name}"`);
    this.name = 'TemplateNotFoundError';
  }
}

export class TemplateAlreadyExistsError extends DomainError {
  constructor(name: string) {
    super(`Un template avec le nom "${name}" existe déjà.`);
    this.name = 'TemplateAlreadyExistsError';
  }
}
