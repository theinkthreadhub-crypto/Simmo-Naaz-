import { googleApiFetch } from './tokens';

export interface DriveFileSummary {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink?: string;
  sizeBytes?: number;
}

function escapeDriveQueryLiteral(value: string): string {
  return value
    .slice(0, 200)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");
}

export async function searchGoogleDrive(
  userId: string,
  query = '',
  maxResults = 8
): Promise<{ files: DriveFileSummary[]; error?: string }> {
  const limit = Math.min(50, Math.max(1, Number(maxResults) || 8));
  let q = 'trashed = false';

  if (query.trim()) {
    const safe = escapeDriveQueryLiteral(query.trim());
    q += ` and (name contains '${safe}' or fullText contains '${safe}')`;
  }

  const params = new URLSearchParams({
    q,
    pageSize: String(limit),
    fields: 'files(id,name,mimeType,modifiedTime,webViewLink,size)',
    orderBy: 'modifiedTime desc'
  });

  const result = await googleApiFetch(
    userId,
    `https://www.googleapis.com/drive/v3/files?${params.toString()}`
  );

  if (!result.response) return { files: [], error: result.error || 'CONNECTION_REQUIRED' };
  if (!result.response.ok) {
    return { files: [], error: `DRIVE_API_ERROR_${result.response.status}` };
  }

  const data = await result.response.json();
  return {
    files: (data.files || []).map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink || undefined,
      sizeBytes: file.size ? Number(file.size) : undefined
    }))
  };
}

async function getDriveFileMetadata(
  userId: string,
  fileId: string
): Promise<{ mimeType?: string; name?: string; size?: number; error?: string }> {
  const result = await googleApiFetch(
    userId,
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size`
  );

  if (!result.response) return { error: result.error || 'CONNECTION_REQUIRED' };
  if (!result.response.ok) {
    return { error: `DRIVE_METADATA_ERROR_${result.response.status}` };
  }

  const data = await result.response.json();
  return {
    mimeType: data.mimeType,
    name: data.name,
    size: data.size ? Number(data.size) : undefined
  };
}

export async function readGoogleDriveFileText(
  userId: string,
  fileId: string,
  mimeType?: string
): Promise<{ text?: string; error?: string }> {
  const metadata = mimeType
    ? { mimeType }
    : await getDriveFileMetadata(userId, fileId);

  if ('error' in metadata && metadata.error) {
    return { error: metadata.error };
  }

  const resolvedMime = metadata.mimeType || '';
  let url: string;

  if (resolvedMime === 'application/vnd.google-apps.document') {
    url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text%2Fplain`;
  } else if (resolvedMime === 'application/vnd.google-apps.spreadsheet') {
    url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text%2Fcsv`;
  } else if (
    resolvedMime.startsWith('text/') ||
    resolvedMime === 'application/json' ||
    resolvedMime === 'application/xml' ||
    resolvedMime === 'application/javascript'
  ) {
    if (typeof metadata.size === 'number' && metadata.size > 500_000) {
      return { error: 'DRIVE_FILE_TOO_LARGE' };
    }
    url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;
  } else {
    return { error: 'UNSUPPORTED_BINARY_FORMAT' };
  }

  const result = await googleApiFetch(userId, url);
  if (!result.response) return { error: result.error || 'CONNECTION_REQUIRED' };
  if (!result.response.ok) {
    return { error: `DRIVE_READ_FAILED_${result.response.status}` };
  }

  const text = (await result.response.text()).slice(0, 20_000);
  return { text };
}
