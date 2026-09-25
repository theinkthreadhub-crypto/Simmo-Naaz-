import { getValidGoogleAccessToken } from './tokens';

export interface CalendarEventSummary {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  meetLink?: string;
  attendeesCount?: number;
}

export async function getGoogleCalendarEvents(
  userId: string,
  timeMin?: string,
  timeMax?: string,
  maxResults: number = 10
): Promise<{ events: CalendarEventSummary[]; error?: string }> {
  const { token, error } = await getValidGoogleAccessToken(userId);
  if (!token || error) {
    return { events: [], error: error || 'CONNECTION_REQUIRED' };
  }

  try {
    const min = timeMin || new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    const max = timeMax || new Date(new Date().setHours(23, 59, 59, 999)).toISOString();

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(min)}&timeMax=${encodeURIComponent(max)}&singleEvents=true&orderBy=startTime&maxResults=${maxResults}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      if (res.status === 401) return { events: [], error: 'TOKEN_EXPIRED' };
      return { events: [], error: `CALENDAR_API_ERROR_${res.status}` };
    }

    const data = await res.json();
    const items = data.items || [];

    const events: CalendarEventSummary[] = items.map((item: any) => ({
      id: item.id,
      summary: item.summary || '(Untitled Event)',
      description: item.description,
      start: item.start?.dateTime || item.start?.date || '',
      end: item.end?.dateTime || item.end?.date || '',
      location: item.location,
      meetLink: item.hangoutLink || item.conferenceData?.entryPoints?.[0]?.uri,
      attendeesCount: item.attendees?.length || 0
    }));

    return { events };
  } catch (err: any) {
    return { events: [], error: err.message };
  }
}

export async function createGoogleCalendarEvent(
  userId: string,
  event: {
    summary: string;
    description?: string;
    startDateTime: string; // ISO String
    endDateTime: string;   // ISO String
    location?: string;
    attendees?: string[];
  }
): Promise<{ eventId?: string; htmlLink?: string; error?: string }> {
  const { token, error } = await getValidGoogleAccessToken(userId);
  if (!token || error) {
    return { error: error || 'CONNECTION_REQUIRED' };
  }

  try {
    const payload: any = {
      summary: event.summary,
      description: event.description || 'Created via MENTRA Personal AI OS',
      start: { dateTime: event.startDateTime, timeZone: 'Asia/Kolkata' },
      end: { dateTime: event.endDateTime, timeZone: 'Asia/Kolkata' }
    };

    if (event.location) payload.location = event.location;
    if (event.attendees && event.attendees.length > 0) {
      payload.attendees = event.attendees.map(email => ({ email }));
    }

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      return { error: `EVENT_CREATION_FAILED_${res.status}` };
    }

    const data = await res.json();
    return { eventId: data.id, htmlLink: data.htmlLink };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function detectCalendarConflicts(
  userId: string,
  targetStart: string,
  targetEnd: string
): Promise<{ hasConflict: boolean; conflictingEvents: CalendarEventSummary[]; error?: string }> {
  const { events, error } = await getGoogleCalendarEvents(userId, targetStart, targetEnd);
  if (error) {
    return { hasConflict: false, conflictingEvents: [], error };
  }

  const startMs = new Date(targetStart).getTime();
  const endMs = new Date(targetEnd).getTime();

  const conflicts = events.filter(e => {
    const eStart = new Date(e.start).getTime();
    const eEnd = new Date(e.end).getTime();
    return (startMs < eEnd && endMs > eStart);
  });

  return {
    hasConflict: conflicts.length > 0,
    conflictingEvents: conflicts
  };
}
