# File Manager - Supabase Storage

Web app for file sharing using Supabase.

## Features
- Sidebar nav: Dashboard/Upload/View
- Drag-drop uploads (images/ZIP/docs)
- Preview/download/delete grid
- Stats dashboard
- Black/white theme

## Supabase Setup (Required)
1. supabase.com → New Project
2. Storage > `files` bucket > Public
3. Settings > API > Copy URL/anon key to script.js
4. Run SQL migrations + deploy Edge Function
5. Bucket policies: public read/list/download + anon DELETE (see supabase/migrations/202411_add_delete_policies.sql)

## Run
Open `index.html` in browser.

## Backend
supabase/README.md for DB/Storage/Edge setup.

## Schema & Database Guide
- [schema.json](schema.json): JSON Schema + SQL DDL for 'files' table.
- [DB_GUIDE.md](DB_GUIDE.md): Full setup + alternatives (Firebase, MongoDB, etc.).


