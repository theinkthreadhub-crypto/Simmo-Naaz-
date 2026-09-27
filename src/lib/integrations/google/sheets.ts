import { googleApiFetch } from './tokens';

export async function readGoogleSheetRange(
  userId: string,
  spreadsheetId: string,
  range = 'Sheet1!A1:Z50'
): Promise<{ rows: unknown[][]; error?: string }> {
  if (!spreadsheetId.trim()) return { rows: [], error: 'SPREADSHEET_ID_REQUIRED' };
  if (!range.trim() || range.length > 300) return { rows: [], error: 'INVALID_SHEET_RANGE' };

  const result = await googleApiFetch(
    userId,
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`
  );

  if (!result.response) return { rows: [], error: result.error || 'CONNECTION_REQUIRED' };
  if (!result.response.ok) {
    return { rows: [], error: `SHEETS_API_ERROR_${result.response.status}` };
  }

  const data = await result.response.json();
  return { rows: (data.values || []).slice(0, 500) };
}

export async function appendGoogleSheetRow(
  userId: string,
  spreadsheetId: string,
  range: string,
  values: Array<string | number | boolean>
): Promise<{ updatedRows?: number; updatedRange?: string; error?: string }> {
  if (!spreadsheetId.trim()) return { error: 'SPREADSHEET_ID_REQUIRED' };
  if (!range.trim() || range.length > 300) return { error: 'INVALID_SHEET_RANGE' };
  if (!Array.isArray(values) || values.length === 0 || values.length > 100) {
    return { error: 'INVALID_SHEET_VALUES' };
  }

  const params = new URLSearchParams({
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS'
  });

  const result = await googleApiFetch(
    userId,
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append?${params.toString()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [values] })
    }
  );

  if (!result.response) return { error: result.error || 'CONNECTION_REQUIRED' };
  if (!result.response.ok) {
    return { error: `SHEET_APPEND_FAILED_${result.response.status}` };
  }

  const data = await result.response.json();
  return {
    updatedRows: Number(data.updates?.updatedRows || 0),
    updatedRange: data.updates?.updatedRange || undefined
  };
}
