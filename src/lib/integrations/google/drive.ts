import { getValidGoogleAccessToken } from './tokens';

export interface DriveFileSummary {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink?: string;
  sizeBytes?: number;
}

export async function searchGoogleDrive(
  userId: string,
  query: string = '',
  maxResults: number = 8
): Promise<{ files: DriveFileSummary[]; error?: string }> {
  const { token, error } = await getValidGoogleAccessToken(userId);
  if (!token || error) {
    return { files: [], error: error || 'CONNECTION_REQUIRED' };
  }

  try {
    let q = "trashed = false";
    if (query) {
      const sanitized = query.replace(/'/g, '');
      q += ` and (name contains '${sanitized}' or fullText contains '${sanitized}')`;
    }

    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=${maxResults}&fields=files(id,name,mimeType,modifiedTime,webViewLink,size)&orderBy=modifiedTime desc`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      if (res.status === 401) return { files: [], error: 'TOKEN_EXPIRED' };
      return { files: [], error: `DRIVE_API_ERROR_${res.status}` };
    }

    const data = await res.json();
    const files: DriveFileSummary[] = (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      modifiedTime: f.modifiedTime,
      webViewLink: f.webViewLink,
      sizeBytes: f.size ? Number(f.size) : undefined
    }));

    return { files };
  } catch (err: any) {
    return { files: [], error: err.message };
  }
}

export async function readGoogleDriveFileText(
  userId: string,
  fileId: string,
  mimeType?: string
): Promise<{ text?: string; error?: string }> {
  const { token, error } = await getValidGoogleAccessToken(userId);
  if (!token || error) {
    return { error: error || 'CONNECTION_REQUIRED' };
  }

  try {
    // If it's a Google Doc, export as plain text
    if (mimeType === 'application/vnd.google-apps.document' || !mimeType) {
      const exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
      const res = await fetch(exportUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const text = await res.text();
        return { text: text.slice(0, 5000) }; // cap text
      }
    }

    // Direct download for plain text, csv, or json
    const getUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const getRes = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (getRes.ok) {
      const text = await getRes.text();
      return { text: text.slice(0, 5000) };
    }

    return { error: 'UNSUPPORTED_BINARY_FORMAT' };
  } catch (err: any) {
    return { error: err.message };
  }
}
