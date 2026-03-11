export class Email {
  private readonly value: string;

  constructor(email: string) {
    const normalized = email.trim().toLowerCase();
    if (!Email.isValid(normalized)) {
      throw new Error(`Format d'email invalide : ${email}`);
    }
    this.value = normalized;
  }

  private static isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
