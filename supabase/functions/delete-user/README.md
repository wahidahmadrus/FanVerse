# delete-user Edge Function

This function permanently deletes a Fan Archive user and their related app data.
It must be deployed to Supabase before the Admin Users danger-zone button can
reach it.

Required secret:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Deploy:

```bash
supabase functions deploy delete-user
```

The service role key belongs only in Supabase function secrets. Do not add it to
frontend `.env` files.
