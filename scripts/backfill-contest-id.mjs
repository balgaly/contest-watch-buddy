/**
 * One-time migration: backfill contestId on existing score documents.
 *
 * Uses firebase-tools' stored credential to authenticate via the Firestore REST API.
 *
 * Usage:
 *   node scripts/backfill-contest-id.mjs
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const firebaserc = JSON.parse(readFileSync(resolve(process.cwd(), '.firebaserc'), 'utf8'));
const projectId = firebaserc.projects?.default;
if (!projectId) {
  console.error('Could not determine project ID from .firebaserc');
  process.exit(1);
}

const BASE = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

// Firebase CLI client ID (public, used by firebase-tools)
const FIREBASE_CLI_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const FIREBASE_CLI_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

async function getAccessToken() {
  const Configstore = require('configstore');
  const cs = new Configstore('firebase-tools');
  const tokens = cs.get('tokens');

  if (!tokens?.refresh_token) {
    throw new Error('No Firebase CLI refresh token found. Run `npx firebase login` first.');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: FIREBASE_CLI_CLIENT_ID,
      client_secret: FIREBASE_CLI_CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

async function listDocuments(collectionPath, token) {
  const docs = [];
  let pageToken = '';
  do {
    const url = `${BASE}/${collectionPath}?pageSize=100${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`LIST ${collectionPath}: ${res.status} ${await res.text()}`);
    const data = await res.json();
    if (data.documents) docs.push(...data.documents);
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return docs;
}

async function patchDocument(docName, fields, token) {
  const url = `https://firestore.googleapis.com/v1/${docName}?updateMask.fieldPaths=contestId`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`PATCH ${docName}: ${res.status} ${await res.text()}`);
  return res.json();
}

function docId(doc) {
  return doc.name.split('/').pop();
}

async function migrate() {
  console.log(`Project: ${projectId}`);
  const token = await getAccessToken();
  console.log('Authenticated via Firebase CLI credentials.\n');

  const contests = await listDocuments('contests', token);
  let updated = 0;

  for (const contest of contests) {
    const contestId = docId(contest);
    const contestants = await listDocuments(`contests/${contestId}/contestants`, token);

    for (const contestant of contestants) {
      const contestantId = docId(contestant);
      const scores = await listDocuments(
        `contests/${contestId}/contestants/${contestantId}/scores`,
        token
      );

      for (const scoreDoc of scores) {
        const existing = scoreDoc.fields?.contestId?.stringValue;
        if (existing === contestId) continue;

        await patchDocument(scoreDoc.name, {
          contestId: { stringValue: contestId },
        }, token);
        updated++;
        const shortPath = scoreDoc.name.split('/documents/')[1];
        console.log(`  Updated: ${shortPath}`);
      }
    }

    console.log(`Contest "${contestId}" done.`);
  }

  console.log(`\nMigration complete. ${updated} document(s) updated.`);
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message || err);
  process.exit(1);
});
