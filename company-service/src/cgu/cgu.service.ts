import crypto from "crypto";
import { CguVersion } from "./cgu.entity";
import { CguVersionModel } from "./cgu.model";
import { OrganizationModel } from "../organization/organization.model";

export class CguService {

  /** Liste toutes les versions triées par date de création (plus récente en premier) */
  async getAll(): Promise<CguVersion[]> {
    return CguVersionModel.find().sort({ createdAt: -1 }).lean() as Promise<CguVersion[]>;
  }

  /** Retourne la version actuellement active (ou null si aucune) */
  async getActive(): Promise<CguVersion | null> {
    return CguVersionModel.findOne({ statut: "ACTIVE" }).lean() as Promise<CguVersion | null>;
  }

  /** Retourne une version par son id */
  async getById(id: string): Promise<CguVersion | null> {
    return CguVersionModel.findOne({ id }).lean() as Promise<CguVersion | null>;
  }

  /** Crée un brouillon — version doit être unique */
  async create(data: Pick<CguVersion, "version" | "titre" | "resume" | "contenu">): Promise<CguVersion> {
    const existing = await CguVersionModel.findOne({ version: data.version });
    if (existing) {
      const err = new Error(`La version "${data.version}" existe déjà`);
      (err as NodeJS.ErrnoException).code = "CONFLICT";
      throw err;
    }
    const doc = new CguVersionModel({
      ...data,
      id: crypto.randomUUID(),
      statut: "BROUILLON",
    });
    const saved = await doc.save();
    return saved.toJSON() as CguVersion;
  }

  /** Met à jour un brouillon (interdit si ACTIVE ou ARCHIVEE) */
  async update(id: string, data: Partial<Pick<CguVersion, "titre" | "resume" | "contenu">>): Promise<CguVersion> {
    const existing = await CguVersionModel.findOne({ id });
    if (!existing) throw new Error("Version introuvable");
    if (existing.statut !== "BROUILLON") {
      throw new Error("Seuls les brouillons peuvent être modifiés");
    }
    const updated = await CguVersionModel.findOneAndUpdate(
      { id },
      { $set: data },
      { returnDocument: "after" }
    ).lean();
    return updated as CguVersion;
  }

  /**
   * Active une version :
   * - Archive la version actuellement active
   * - Passe la version cible en ACTIVE
   * - Enregistre qui l'a activée et quand
   */
  async activate(id: string, activatedBy: string): Promise<CguVersion> {
    const target = await CguVersionModel.findOne({ id });
    if (!target) throw new Error("Version introuvable");
    if (target.statut === "ACTIVE") throw new Error("Cette version est déjà active");
    if (target.statut === "ARCHIVEE") throw new Error("Une version archivée ne peut pas être réactivée");

    // Archiver l'actuelle
    await CguVersionModel.updateMany({ statut: "ACTIVE" }, { $set: { statut: "ARCHIVEE" } });

    // Activer la nouvelle
    const activated = await CguVersionModel.findOneAndUpdate(
      { id },
      { $set: { statut: "ACTIVE", activatedAt: new Date(), activatedBy } },
      { returnDocument: "after" }
    ).lean();
    return activated as CguVersion;
  }

  /**
   * Conformité : pour chaque organisation active, indique si elle a accepté
   * la version actuellement active.
   */
  async getCompliance(): Promise<{
    orgId: string;
    raisonSociale: string;
    type: string;
    termsAcceptedVersion: string | null;
    termsAcceptedAt: Date | null;
    conforme: boolean;
    versionAttendue: string | null;
  }[]> {
    const [activeVersion, orgs] = await Promise.all([
      this.getActive(),
      OrganizationModel.find({ statut: "ACTIVE" }).lean(),
    ]);

    return orgs.map((org) => ({
      orgId:                org["id"] as string,
      raisonSociale:        org["raisonSociale"] as string,
      type:                 org["type"] as string,
      termsAcceptedVersion: (org["termsAcceptedVersion"] as string | null) ?? null,
      termsAcceptedAt:      (org["termsAcceptedAt"] as Date | null) ?? null,
      conforme:             activeVersion
        ? org["termsAcceptedVersion"] === activeVersion.version
        : false,
      versionAttendue:      activeVersion?.version ?? null,
    }));
  }
}
