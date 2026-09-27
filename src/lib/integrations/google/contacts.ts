import { googleApiFetch } from './tokens';

export interface GoogleContactSummary {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  organization?: string;
}

export async function searchGoogleContacts(
  userId: string,
  query = '',
  pageSize = 10
): Promise<{ contacts: GoogleContactSummary[]; error?: string }> {
  const limit = Math.min(30, Math.max(1, Number(pageSize) || 10));
  let url: string;

  if (query.trim()) {
    const params = new URLSearchParams({
      query: query.trim().slice(0, 200),
      readMask: 'names,emailAddresses,phoneNumbers,organizations',
      pageSize: String(limit)
    });
    url = `https://people.googleapis.com/v1/people:searchContacts?${params.toString()}`;
  } else {
    const params = new URLSearchParams({
      personFields: 'names,emailAddresses,phoneNumbers,organizations',
      pageSize: String(limit),
      sortOrder: 'LAST_NAME_ASCENDING'
    });
    url = `https://people.googleapis.com/v1/people/me/connections?${params.toString()}`;
  }

  const result = await googleApiFetch(userId, url);
  if (!result.response) return { contacts: [], error: result.error || 'CONNECTION_REQUIRED' };
  if (!result.response.ok) {
    return { contacts: [], error: `CONTACTS_API_ERROR_${result.response.status}` };
  }

  const data = await result.response.json();
  const people = query.trim()
    ? (data.results || []).map((row: any) => row.person)
    : (data.connections || []);

  const contacts = people
    .filter((person: any) => Boolean(person?.resourceName))
    .map((person: any) => ({
      id: person.resourceName,
      name: person.names?.[0]?.displayName || 'Unnamed Contact',
      email: person.emailAddresses?.[0]?.value || undefined,
      phone: person.phoneNumbers?.[0]?.value || undefined,
      organization: person.organizations?.[0]?.name || undefined
    }));

  return { contacts };
}
