/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAccessToken } from '../lib/firebase';
import { CalendarEvent, Task, FileItem } from '../types';

// Helper to check if a token exists
export async function isGoogleConnected(): Promise<boolean> {
  const token = await getAccessToken();
  return token !== null && token !== '';
}

// ------------------------------
// 1. GOOGLE CALENDAR
// ------------------------------

export async function fetchGoogleCalendarEvents(): Promise<any[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Account not connected');

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=250', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Google Calendar: ${res.statusText}`);
  }

  const data = await res.json();
  return data.items || [];
}

export async function createGoogleCalendarEvent(event: Partial<CalendarEvent>): Promise<any> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Account not connected');

  const startIso = event.start?.includes('T') ? event.start : `${event.start}T09:00:00`;
  const endIso = event.end?.includes('T') ? event.end : `${event.end}T10:00:00`;

  const body = {
    summary: event.title,
    description: event.description,
    start: { dateTime: startIso },
    end: { dateTime: endIso },
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Failed to create calendar event: ${res.statusText}`);
  }

  return await res.json();
}

export async function updateGoogleCalendarEvent(gcalId: string, event: Partial<CalendarEvent>): Promise<any> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Account not connected');

  const startIso = event.start?.includes('T') ? event.start : `${event.start}T09:00:00`;
  const endIso = event.end?.includes('T') ? event.end : `${event.end}T10:00:00`;

  const body = {
    summary: event.title,
    description: event.description,
    start: { dateTime: startIso },
    end: { dateTime: endIso },
  };

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${gcalId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Failed to update calendar event: ${res.statusText}`);
  }

  return await res.json();
}

export async function deleteGoogleCalendarEvent(gcalId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Account not connected');

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${gcalId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete calendar event: ${res.statusText}`);
  }
}


// ------------------------------
// 2. GOOGLE TASKS
// ------------------------------

export async function fetchGoogleTasks(): Promise<any[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Account not connected');

  // Fetch task lists first
  const listsRes = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!listsRes.ok) {
    throw new Error(`Failed to fetch Google Task Lists: ${listsRes.statusText}`);
  }

  const listsData = await listsRes.json();
  const lists = listsData.items || [];
  if (lists.length === 0) return [];

  const defaultListId = lists[0].id; // Use first task list

  // Fetch tasks from default list
  const tasksRes = await fetch(`https://www.googleapis.com/tasks/v1/lists/${defaultListId}/tasks?showCompleted=true&showHidden=true`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!tasksRes.ok) {
    throw new Error(`Failed to fetch Google Tasks: ${tasksRes.statusText}`);
  }

  const tasksData = await tasksRes.json();
  return tasksData.items || [];
}

export async function createGoogleTask(task: Partial<Task>): Promise<any> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Account not connected');

  const listsRes = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listsRes.ok) throw new Error('Could not retrieve task lists');
  const listsData = await listsRes.json();
  const defaultListId = listsData.items?.[0]?.id || '@default';

  const body = {
    title: task.title,
    notes: task.description,
    status: task.isCompleted ? 'completed' : 'needsAction',
    due: task.deadline ? `${task.deadline}T00:00:00.000Z` : undefined,
  };

  const res = await fetch(`https://www.googleapis.com/tasks/v1/lists/${defaultListId}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Failed to create Google task: ${res.statusText}`);
  }

  return await res.json();
}

export async function updateGoogleTask(gtaskId: string, task: Partial<Task>): Promise<any> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Account not connected');

  const listsRes = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listsRes.ok) throw new Error('Could not retrieve task lists');
  const listsData = await listsRes.json();
  const defaultListId = listsData.items?.[0]?.id || '@default';

  const body = {
    id: gtaskId,
    title: task.title,
    notes: task.description,
    status: task.isCompleted ? 'completed' : 'needsAction',
    due: task.deadline ? `${task.deadline}T00:00:00.000Z` : undefined,
  };

  const res = await fetch(`https://www.googleapis.com/tasks/v1/lists/${defaultListId}/tasks/${gtaskId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Failed to update Google task: ${res.statusText}`);
  }

  return await res.json();
}

export async function deleteGoogleTask(gtaskId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Account not connected');

  const listsRes = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listsRes.ok) throw new Error('Could not retrieve task lists');
  const listsData = await listsRes.json();
  const defaultListId = listsData.items?.[0]?.id || '@default';

  const res = await fetch(`https://www.googleapis.com/tasks/v1/lists/${defaultListId}/tasks/${gtaskId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete Google task: ${res.statusText}`);
  }
}


// ------------------------------
// 3. GOOGLE DRIVE
// ------------------------------

export async function fetchGoogleDriveFiles(): Promise<any[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Account not connected');

  const res = await fetch(
    'https://www.googleapis.com/drive/v3/files?q=trashed=false&fields=files(id,name,mimeType,size,createdTime,parents)',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch Drive files: ${res.statusText}`);
  }

  const data = await res.json();
  return data.files || [];
}

export async function createGoogleDriveFolder(name: string, parentId?: string): Promise<any> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Account not connected');

  const metadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId ? [parentId] : undefined,
  };

  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    throw new Error(`Failed to create Drive folder: ${res.statusText}`);
  }

  return await res.json();
}

export async function uploadFileToGoogleDrive(
  name: string,
  mimeType: string,
  content: string | Blob,
  parentId?: string
): Promise<any> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Account not connected');

  // Simplified multipart upload
  const boundary = 'foo_bar_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name,
    parents: parentId ? [parentId] : undefined,
  };

  let fileContentBase64 = '';
  if (typeof content === 'string') {
    fileContentBase64 = btoa(content);
  } else {
    // Read blob as base64
    fileContentBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.substring(result.indexOf(',') + 1));
      };
      reader.readAsDataURL(content);
    });
  }

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n` +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    fileContentBase64 +
    closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    throw new Error(`Failed to upload file to Google Drive: ${res.statusText}`);
  }

  return await res.json();
}

export async function deleteFileFromGoogleDrive(fileId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Account not connected');

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete file from Google Drive: ${res.statusText}`);
  }
}

export async function updateGoogleDriveFile(fileId: string, metadata: { name?: string; addParents?: string; removeParents?: string }): Promise<any> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Account not connected');

  let url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const query: string[] = [];
  if (metadata.addParents) query.push(`addParents=${metadata.addParents}`);
  if (metadata.removeParents) query.push(`removeParents=${metadata.removeParents}`);
  if (query.length > 0) url += `?${query.join('&')}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: metadata.name }),
  });

  if (!res.ok) {
    throw new Error(`Failed to update file in Google Drive: ${res.statusText}`);
  }

  return await res.json();
}

export async function downloadFileFromGoogleDrive(fileId: string): Promise<Blob> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Account not connected');

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to download file: ${res.statusText}`);
  }

  return await res.blob();
}
