import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;
const MIN_LENGTH = 8;

export class Password {
  private readonly hash: string;

  private constructor(hash: string) {
    this.hash = hash;
  }

  static async fromPlainText(plainText: string): Promise<Password> {
    if (plainText.length < MIN_LENGTH) {
      throw new Error(
        `Le mot de passe doit contenir au moins ${MIN_LENGTH} caractères.`,
      );
    }
    const hash = await bcrypt.hash(plainText, SALT_ROUNDS);
    return new Password(hash);
  }

  static fromHash(hash: string): Password {
    return new Password(hash);
  }

  async verify(plainText: string): Promise<boolean> {
    return bcrypt.compare(plainText, this.hash);
  }

  toString(): string {
    return this.hash;
  }
}
