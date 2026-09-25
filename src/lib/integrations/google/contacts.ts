import { getValidGoogleAccessToken } from './tokens';

export interface GoogleContactSummary {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  organization?: string;
}

export async function searchGoogleContacts(
  userId: string,
  query: string = '',
  pageSize: number = 10
): Promise<{ contacts: GoogleContactSummary[]; error?: string }> {
  const { token, error } = await getValidGoogleAccessToken(userId);
  if (!token || error) {
    return { contacts: [], error: error || 'CONNECTION_REQUIRED' };
  }

  try {
    let url = `https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,organizations&pageSize=${pageSize}`;
    if (query) {
      url = `https://people.googleapis.com/v1/people:searchContacts?query=${encodeURIComponent(query)}&readMask=names,emailAddresses,phoneNumbers,organizations&pageSize=${pageSize}`;
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      if (res.status === 401) return { contacts: [], error: 'TOKEN_EXPIRED' };
      return { contacts: [], error: `CONTACTS_API_ERROR_${res.status}` };
    }

    const data = await res.json();
    const people = data.connections || (data.results || []).map((r: any) => r.person) || [];

    const contacts: GoogleContactSummary[] = people.map((p: any) => {
      const name = p.names?.[0]?.displayName || 'Unnamed Contact';
      const email = p.emailAddresses?.[0]?.value;
      const phone = p.phoneNumbers?.[0]?.value;
      const organization = p.organizations?.[0]?.name;

      return {
        id: p.resourceName || `contact_${Math.random().toString(36).slice(2)}`,
        name,
        email,
        phone,
        organization
      };
    });

    return { contacts };
  } catch (err: any) {
    return { contacts: [], error: err.message };
  }
}
