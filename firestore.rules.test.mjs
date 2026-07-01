import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { readFile } from "node:fs/promises";

const projectId = "demo-wm26-tipit";
let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: await readFile("firestore.rules", "utf8"),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "invites", "ABC123"), {
      ownerUid: "inviter",
      createdAt: new Date("2026-06-01T00:00:00Z"),
    });
    await setDoc(doc(db, "users", "alice"), {
      displayName: "Alice",
      email: "alice@example.com",
      inviteCode: "ALICE1",
      invitedBy: "ABC123",
      createdAt: new Date("2026-06-02T00:00:00Z"),
    });
    await setDoc(doc(db, "results", "FINISHED"), {
      matchId: "FINISHED",
      status: "FT",
      homeGoals: 2,
      awayGoals: 0,
    });
  });
});

after(async () => {
  await testEnv?.cleanup();
});

function authDb(uid, email = `${uid}@example.com`) {
  return testEnv.authenticatedContext(uid, { email }).firestore();
}

test("only exact invitation lookups are public", async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(db, "invites", "ABC123")));
  await assertFails(getDocs(collection(db, "invites")));
  await assertFails(getDoc(doc(db, "users", "alice")));
  await assertFails(getDoc(doc(db, "results", "FINISHED")));
});

test("signed-in members can read shared game data", async () => {
  const db = authDb("alice");
  await assertSucceeds(getDocs(collection(db, "users")));
  await assertSucceeds(getDocs(collection(db, "tips")));
  await assertSucceeds(getDoc(doc(db, "results", "FINISHED")));
});

test("a new account requires a valid invitation", async () => {
  const validDb = authDb("new-user", "new@example.com");
  await assertSucceeds(
    setDoc(doc(validDb, "users", "new-user"), {
      displayName: "New User",
      email: "new@example.com",
      inviteCode: "NEW123",
      invitedBy: "ABC123",
      createdAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    setDoc(doc(validDb, "invites", "NEW123"), {
      ownerUid: "new-user",
      createdAt: serverTimestamp(),
    }),
  );

  const invalidDb = authDb("intruder", "intruder@example.com");
  await assertFails(
    setDoc(doc(invalidDb, "users", "intruder"), {
      displayName: "Intruder",
      email: "intruder@example.com",
      inviteCode: "BAD123",
      invitedBy: "MISSING",
      createdAt: serverTimestamp(),
    }),
  );
});

test("members may change only their own display name", async () => {
  const db = authDb("alice");
  await assertSucceeds(
    updateDoc(doc(db, "users", "alice"), { displayName: "Alice Updated" }),
  );
  await assertFails(
    updateDoc(doc(db, "users", "alice"), { email: "changed@example.com" }),
  );
});

test("members may write only their own open match tips", async () => {
  const db = authDb("alice");
  const validTip = {
    uid: "alice",
    matchId: "FUTURE",
    homeGoals: 2,
    awayGoals: 1,
    updatedAt: serverTimestamp(),
  };
  await assertSucceeds(setDoc(doc(db, "tips", "alice__FUTURE"), validTip));
  await assertFails(setDoc(doc(db, "tips", "bob__FUTURE"), validTip));
  await assertFails(
    setDoc(doc(db, "tips", "alice__FINISHED"), {
      ...validTip,
      matchId: "FINISHED",
    }),
  );
});

test("only the admin may write results and events", async () => {
  const memberDb = authDb("alice");
  await assertFails(
    setDoc(doc(memberDb, "results", "NEW"), { homeGoals: 1, awayGoals: 0 }),
  );

  const adminDb = authDb("admin", "kaozra@hotmail.com");
  await assertSucceeds(
    setDoc(doc(adminDb, "results", "NEW"), { homeGoals: 1, awayGoals: 0 }),
  );
  await assertSucceeds(
    setDoc(doc(adminDb, "events", "NEW"), { events: [] }),
  );
});

test("special predictions remain private to writes by their owner", async () => {
  const db = authDb("alice");
  await assertSucceeds(
    setDoc(doc(db, "sondertips", "alice"), {
      champion: "Schweiz",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    setDoc(doc(db, "sondertips", "bob"), {
      champion: "Schweiz",
      updatedAt: serverTimestamp(),
    }),
  );
});

test("test environment is connected to the emulator", () => {
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
});
