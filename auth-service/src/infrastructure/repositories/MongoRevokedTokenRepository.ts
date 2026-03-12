import { IRevokedTokenRepository } from "../../domain/repositories/IRevokedTokenRepository";
import { RevokedTokenModel } from "../db/RevokedTokenModel";

export class MongoRevokedTokenRepository implements IRevokedTokenRepository {
  async revoke(token: string, expiresAt: Date): Promise<void> {
    // upsert : idempotent si le même token est révoqué deux fois
    await RevokedTokenModel.updateOne(
      { token },
      { $set: { token, expiresAt } },
      { upsert: true },
    );
  }

  async isRevoked(token: string): Promise<boolean> {
    const doc = await RevokedTokenModel.findOne({ token });
    return doc !== null;
  }
}
