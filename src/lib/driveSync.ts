/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAccessToken } from './auth';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

export async function findOrCreateFolder(folderName: string): Promise<string> {
  const token = getAccessToken();
  if (!token) throw new Error('No access token');

  // Find existing folder
  const query = encodeURIComponent(`name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const findRes = await fetch(`${DRIVE_API_BASE}/files?q=${query}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const findData = await findRes.json();

  if (findData.files && findData.files.length > 0) {
    return findData.files[0].id;
  }

  // Create new folder
  const createRes = await fetch(`${DRIVE_API_BASE}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    })
  });
  const createData = await createRes.json();
  return createData.id;
}

export async function uploadBackupFile(folderId: string, fileName: string, data: any) {
  const token = getAccessToken();
  if (!token) throw new Error('No access token');

  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: 'application/json'
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));

  const res = await fetch(`${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });

  if (!res.ok) {
    const err = await res.json();
    console.error('Upload failed:', err);
    throw new Error('Drive upload failed');
  }

  return res.json();
}

export async function checkAndSync(data: any): Promise<boolean> {
  const lastSync = localStorage.getItem('sos.v2.lastSync');
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  if (!lastSync || (now - parseInt(lastSync)) > ONE_DAY) {
    try {
      const folderId = await findOrCreateFolder('SOS');
      const fileName = `sos-backup-${new Date().toISOString().split('T')[0]}.json`;
      await uploadBackupFile(folderId, fileName, data);
      localStorage.setItem('sos.v2.lastSync', now.toString());
      return true;
    } catch (err) {
      console.error('Auto sync failed:', err);
      return false;
    }
  }
  return false;
}
