import { getValidGoogleAccessToken } from './tokens';

export async function readGoogleSheetRange(
  userId: string,
  spreadsheetId: string,
  range: string = 'Sheet1!A1:Z50'
): Promise<{ rows: any[][]; error?: string }> {
  const { token, error } = await getValidGoogleAccessToken(userId);
  if (!token || error) {
    return { rows: [], error: error || 'CONNECTION_REQUIRED' };
  }

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      if (res.status === 401) return { rows: [], error: 'TOKEN_EXPIRED' };
      return { rows: [], error: `SHEETS_API_ERROR_${res.status}` };
    }

    const data = await res.json();
    return { rows: data.values || [] };
  } catch (err: any) {
    return { rows: [], error: err.message };
  }
}

export async function appendGoogleSheetRow(
  userId: string,
  spreadsheetId: string,
  range: string,
  values: (string | number)[]
): Promise<{ updatedRows?: number; error?: string }> {
  const { token, error } = await getValidGoogleAccessToken(userId);
  if (!token || error) {
    return { error: error || 'CONNECTION_REQUIRED' };
  }

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [values]
      })
    });

    if (!res.ok) {
      return { error: `SHEET_APPEND_FAILED_${res.status}` };
    }

    const data = await res.json();
    return { updatedRows: data.updates?.updatedRows || 1 };
  } catch (err: any) {
    return { error: err.message };
  }
}
