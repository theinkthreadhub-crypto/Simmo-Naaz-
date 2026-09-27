import { googleApiFetch } from './tokens';

export interface CalendarEventSummary {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  meetLink?: string;
  attendeesCount?: number;
  htmlLink?: string;
}

function istDayWindow(): { min: string; max: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const get = (type: string) => parts.find(part => part.type === type)?.value || '';
  const date = `${get('year')}-${get('month')}-${get('day')}`;

  return {
    min: `${date}T00:00:00+05:30`,
    max: `${date}T23:59:59+05:30`
  };
}

function validDateTime(value: string): boolean {
  return Boolean(value && Number.isFinite(new Date(value).getTime()));
}

export async function getGoogleCalendarEvents(
  userId: string,
  timeMin?: string,
  timeMax?: string,
  maxResults = 10
): Promise<{ events: CalendarEventSummary[]; error?: string }> {
  const day = istDayWindow();
  const min = timeMin || day.min;
  const max = timeMax || day.max;

  if (!validDateTime(min) || !validDateTime(max)) {
    return { events: [], error: 'INVALID_CALENDAR_WINDOW' };
  }

  const params = new URLSearchParams({
    timeMin: min,
    timeMax: max,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(Math.min(50, Math.max(1, Number(maxResults) || 10)))
  });

  const result = await googleApiFetch(
    userId,
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`
  );

  if (!result.response) return { events: [], error: result.error || 'CONNECTION_REQUIRED' };
  if (!result.response.ok) {
    return { events: [], error: `CALENDAR_API_ERROR_${result.response.status}` };
  }

  const data = await result.response.json();
  return {
    events: (data.items || []).map((item: any) => ({
      id: item.id,
      summary: item.summary || '(Untitled Event)',
      description: item.description || undefined,
      start: item.start?.dateTime || item.start?.date || '',
      end: item.end?.dateTime || item.end?.date || '',
      location: item.location || undefined,
      meetLink: item.hangoutLink || item.conferenceData?.entryPoints?.[0]?.uri || undefined,
      attendeesCount: item.attendees?.length || 0,
      htmlLink: item.htmlLink || undefined
    }))
  };
}

export async function createGoogleCalendarEvent(
  userId: string,
  event: {
    summary: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    location?: string;
    attendees?: string[];
  }
): Promise<{ eventId?: string; htmlLink?: string; error?: string }> {
  if (!event.summary?.trim()) return { error: 'EVENT_TITLE_REQUIRED' };
  if (!validDateTime(event.startDateTime) || !validDateTime(event.endDateTime)) {
    return { error: 'INVALID_EVENT_DATETIME' };
  }

  if (new Date(event.endDateTime).getTime() <= new Date(event.startDateTime).getTime()) {
    return { error: 'EVENT_END_MUST_BE_AFTER_START' };
  }

  const attendees = (event.attendees || [])
    .map(email => email.trim())
    .filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    .slice(0, 50);

  const params = new URLSearchParams();
  if (attendees.length > 0) params.set('sendUpdates', 'all');

  const result = await googleApiFetch(
    userId,
    `https://www.googleapis.com/calendar/v3/calendars/primary/events${params.toString() ? `?${params.toString()}` : ''}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: event.summary.trim(),
        description: event.description?.trim() || undefined,
        start: { dateTime: event.startDateTime, timeZone: 'Asia/Kolkata' },
        end: { dateTime: event.endDateTime, timeZone: 'Asia/Kolkata' },
        ...(event.location?.trim() ? { location: event.location.trim() } : {}),
        ...(attendees.length > 0 ? { attendees: attendees.map(email => ({ email })) } : {})
      })
    }
  );

  if (!result.response) return { error: result.error || 'CONNECTION_REQUIRED' };
  if (!result.response.ok) {
    return { error: `EVENT_CREATION_FAILED_${result.response.status}` };
  }

  const data = await result.response.json();
  return { eventId: data.id, htmlLink: data.htmlLink };
}

export async function detectCalendarConflicts(
  userId: string,
  targetStart: string,
  targetEnd: string
): Promise<{ hasConflict: boolean; conflictingEvents: CalendarEventSummary[]; error?: string }> {
  if (!validDateTime(targetStart) || !validDateTime(targetEnd)) {
    return { hasConflict: false, conflictingEvents: [], error: 'INVALID_EVENT_DATETIME' };
  }

  const { events, error } = await getGoogleCalendarEvents(
    userId,
    targetStart,
    targetEnd,
    50
  );

  if (error) {
    return { hasConflict: false, conflictingEvents: [], error };
  }

  const startMs = new Date(targetStart).getTime();
  const endMs = new Date(targetEnd).getTime();

  const conflicts = events.filter(event => {
    const eventStart = new Date(event.start).getTime();
    const eventEnd = new Date(event.end).getTime();
    return Number.isFinite(eventStart) && Number.isFinite(eventEnd) &&
      startMs < eventEnd && endMs > eventStart;
  });

  return { hasConflict: conflicts.length > 0, conflictingEvents: conflicts };
}
