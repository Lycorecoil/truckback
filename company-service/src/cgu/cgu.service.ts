import crypto from "crypto";
import { CguVersion } from "./cgu.entity";
import { CguVersionModel } from "./cgu.model";
import { OrganizationModel } from "../organization/organization.model";

/** Texte de la version initiale 1.0 (HTML) */
const CGU_V1_CONTENU = `<h2>Conditions Générales d'Utilisation</h2>
<p><em>Version 1.0 — en vigueur au 1er janvier 2025</em></p>

<h3>1. Objet</h3>
<p>Les présentes Conditions Générales d'Utilisation régissent l'accès et l'utilisation de la plateforme Elimmekatruck, service de mise en relation entre expéditeurs et transporteurs pour le transport de marchandises en Afrique de l'Ouest.</p>

<h3>2. Acceptation des Conditions Générales d'Utilisation</h3>
<p>En créant un compte et en utilisant la plateforme, l'organisation représentée par l'utilisateur accepte sans réserve les présentes Conditions Générales d'Utilisation. L'acceptation est enregistrée avec la date, la version et l'identité du représentant légal ayant cliqué.</p>

<h3>3. Accès au service</h3>
<p>L'accès à la plateforme est réservé aux professionnels (personnes morales). Chaque organisation dispose d'un espace sécurisé accessible via des identifiants personnels. L'utilisateur s'engage à maintenir la confidentialité de ses accès et à informer immédiatement Elimmekatruck de tout accès non autorisé.</p>

<h3>4. Obligations de l'utilisateur</h3>
<p>L'utilisateur s'engage à :</p>
<ul>
  <li>fournir des informations exactes, complètes et à jour lors de son inscription ;</li>
  <li>respecter les lois et réglementations applicables dans les pays concernés ;</li>
  <li>ne pas utiliser la plateforme à des fins illicites, frauduleuses ou contraires aux bonnes mœurs ;</li>
  <li>ne pas perturber le fonctionnement technique de la plateforme.</li>
</ul>

<h3>5. Responsabilités</h3>
<p>Elimmekatruck met en relation les parties mais n'est pas responsable des contrats conclus entre expéditeurs et transporteurs, ni de l'exécution des prestations de transport. Chaque partie reste seule responsable de ses obligations contractuelles, légales et réglementaires.</p>

<h3>6. Données personnelles et confidentialité</h3>
<p>Les données collectées (informations de l'organisation, coordonnées, données de transport) sont utilisées exclusivement pour le fonctionnement de la plateforme et l'amélioration des services. Elles ne sont pas cédées à des tiers à des fins commerciales. L'utilisateur dispose d'un droit d'accès, de rectification et de suppression en contactant support@elimmekatruck.com.</p>

<h3>7. Propriété intellectuelle</h3>
<p>L'ensemble des éléments de la plateforme (interface, marque, algorithmes, données agrégées) est la propriété exclusive d'Elimmekatruck. Toute reproduction ou exploitation sans autorisation est interdite.</p>

<h3>8. Modification des Conditions Générales d'Utilisation</h3>
<p>Elimmekatruck se réserve le droit de modifier les présentes Conditions Générales d'Utilisation à tout moment. Toute modification majeure sera notifiée aux utilisateurs par email et/ou notification dans l'application. La poursuite de l'utilisation après notification vaut acceptation des nouvelles Conditions Générales d'Utilisation.</p>

<h3>9. Résiliation</h3>
<p>Elimmekatruck peut suspendre ou résilier l'accès d'une organisation en cas de violation des présentes Conditions Générales d'Utilisation ou de la loi applicable, après mise en demeure restée sans effet pendant 72 heures, sauf urgence.</p>

<h3>10. Droit applicable et juridiction</h3>
<p>Les présentes Conditions Générales d'Utilisation sont soumises au droit de la République du Bénin. Tout litige relatif à leur interprétation ou leur exécution sera soumis aux juridictions compétentes de Cotonou, après tentative de résolution amiable.</p>`;

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
   * Seed idempotent : crée et active la version 1.0 si aucune version n'existe.
   * Appelé au démarrage du service — sans effet si la collection n'est pas vide.
   */
  async seedInitialVersion(): Promise<void> {
    const count = await CguVersionModel.countDocuments();
    if (count > 0) return;

    const doc = new CguVersionModel({
      id:      crypto.randomUUID(),
      version: "1.0",
      titre:   "Conditions Générales d'Utilisation v1.0",
      resume:  "Version initiale des Conditions Générales d'Utilisation de la plateforme Elimmekatruck.",
      contenu: CGU_V1_CONTENU,
      statut:  "ACTIVE",
      activatedAt: new Date("2025-01-01"),
      activatedBy: "system",
    });
    await doc.save();
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
