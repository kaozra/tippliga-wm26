import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { pathToFileURL } from "node:url";

function initializeFirebase() {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT secret is not configured");
  }
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
  }
  return getFirestore();
}

export async function migrateInvites(db = initializeFirebase()) {
  const users = await db.collection("users").get();
  let migrated = 0;
  let skipped = 0;
  let batch = db.batch();
  let batchSize = 0;

  for (const user of users.docs) {
    const code = String(user.data().inviteCode || "").trim().toUpperCase();
    if (!code) {
      skipped += 1;
      continue;
    }

    batch.set(
      db.collection("invites").doc(code),
      {
        ownerUid: user.id,
        createdAt: user.data().createdAt || FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    migrated += 1;
    batchSize += 1;

    if (batchSize === 400) {
      await batch.commit();
      batch = db.batch();
      batchSize = 0;
    }
  }

  if (batchSize > 0) await batch.commit();
  return { users: users.size, migrated, skipped };
}

export async function main() {
  const summary = await migrateInvites();
  console.log(`[invite-migration] ${JSON.stringify(summary)}`);
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main().catch((error) => {
    console.error(`[invite-migration] ${error.stack || error.message || error}`);
    process.exitCode = 1;
  });
}
