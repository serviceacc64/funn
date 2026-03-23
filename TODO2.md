# Supabase Delete Trigger Deployed

✅ Edge Function `delete-file` ready
✅ Trigger SQL ready (0002_add_delete_trigger.sql)
✅ RLS delete policy ready (0003_add_delete_policy.sql)

**Deploy Steps:**
```
supabase db push  # Run migrations
supabase functions deploy delete-file
```

**Test:** Upload file → DB delete → Storage auto-cleans.

