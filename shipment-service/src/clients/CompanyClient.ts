import { fetchWithTimeout } from "../utils/fetchWithTimeout";

const COMPANY_SERVICE_URL = process.env['COMPANY_SERVICE_URL'] ?? 'http://localhost:3001';

export async function getOrganizationEmail(
  tenantId: string,
  type: 'company' | 'transporter',
): Promise<string | null> {
  try {
    const route = type === 'company' ? 'company' : 'transporter';
    const res = await fetchWithTimeout(`${COMPANY_SERVICE_URL}/${route}/tenant/${tenantId}`);
    if (!res.ok) return null;
    const org = await res.json() as { email?: string };
    return org.email ?? null;
  } catch {
    return null;
  }
}
