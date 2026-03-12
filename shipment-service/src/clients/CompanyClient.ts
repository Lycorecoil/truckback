const COMPANY_SERVICE_URL = process.env['COMPANY_SERVICE_URL'] ?? 'http://localhost:3001';

/**
 * Récupère l'email réel d'une organisation depuis le company-service.
 * Utilise le tenantId (= Organization.tenantId) — pas le userId auth.
 * Retourne null si l'organisation est introuvable ou en cas d'erreur réseau.
 */
export async function getOrganizationEmail(
  tenantId: string,
  type: 'company' | 'transporter',
): Promise<string | null> {
  try {
    const route = type === 'company' ? 'company' : 'transporter';
    const res = await fetch(`${COMPANY_SERVICE_URL}/${route}/tenant/${tenantId}`);
    if (!res.ok) return null;
    const org = await res.json() as { email?: string };
    return org.email ?? null;
  } catch {
    return null;
  }
}
