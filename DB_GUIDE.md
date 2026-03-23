# Database Setup Guide for File Manager

This guide covers setting up the **Supabase schema** (default) and migrating to **alternative databases**.

## 1. Supabase (Recommended - Default)

### Prerequisites
- Sign up at [supabase.com](https://supabase.com)
- Create new project

### Schema Setup
1. **Storage Bucket**:
   - Dashboard > Storage > New Bucket: `files`
   - Set **Public bucket**
   - Policies:
     ```
     (role() = 'anon') -- Public read/download/list
     ```
     ```
     (role() = 'anon') -- Anon DELETE (via Edge Function trigger)
     ```

2. **Database Table**:
   - SQL Editor > Run schema from `schema.json` > `sql_ddl.supabase_postgres`
   - Or [copy DDL here](#).

3. **Edge Function (Auto-delete storage on DB delete)**:
   ```
   supabase functions new delete-file
   supabase functions deploy delete-file
   ```
   - Trigger: `AFTER DELETE ON files` calls function to storage.remove().

4. **Update script.js**:
   ```js
   const SUPABASE_URL = 'YOUR_PROJECT_URL';
   const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
   ```

5. **Test**: Upload file → Verify DB + Storage.

## 2. Firebase Firestore + Storage (NoSQL Alternative)

### Setup
1. [console.firebase.google.com](https://console.firebase.google.com) > New project.
2. Enable Firestore + Storage (public rules for demo).

### Schema Mapping
```
files/{docId}
  - name: string
  - size: number
  - mimeType: string
  - path: string (Storage ref)
  - uploadedAt: timestamp
```

### Code Changes (script.js)
```js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, deleteObject, getDownloadURL } from 'firebase/storage';

const firebaseConfig = { ... };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Upload example
const storageRef = ref(storage, `files/${Date.now()}-${file.name}`);
await uploadBytes(storageRef, file);
await addDoc(collection(db, 'files'), {
  name: file.name, size: file.size, mimeType: file.type,
  path: storageRef.fullPath, uploadedAt: new Date()
});
```

### Rules
```
Firestore: allow read, write: if true;  // Production: auth rules
Storage: allow read, write: if true;
```

## 3. MongoDB Atlas (NoSQL)

1. [cloud.mongodb.com](https://cloud.mongodb.com) > Free cluster.
2. Network Access: Allow all (demo).
3. Database > files > Insert schema as above (no SQL needed).

### JS Changes
Use `mongodb` driver or Realm SDK. Similar to Firebase.

## 4. Self-Hosted PostgreSQL

```bash
docker run -p 5432:5432 -e POSTGRES_PASSWORD=pass postgres
```
- Connect via pgAdmin/psql, run DDL from schema.json.
- Update supabaseClient to direct Postgres client (e.g., pg.js) + handle storage separately (MinIO/S3).

## 5. LocalStorage Fallback (No Backend)

Replace Supabase calls:
```js
// Save files as base64 (small files only)
localStorage.setItem('files', JSON.stringify(files));
// Storage: IndexedDB for blobs
```

## Migration Tips
- Export Supabase data: `supabase db dump`.
- Core ops: CRUD on 'files'.
- Auth optional (add user_id field).
- Storage separate: Use S3-compatible for alternatives.

See `schema.json` for exact structure.

