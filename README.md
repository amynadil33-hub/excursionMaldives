# Excursion Maldives

## Google sign-in setup

The sign-in and sign-up screens support Google OAuth through Supabase Auth.

1. In Google Auth Platform, create an OAuth 2.0 Web application.
2. Add the Supabase callback URL shown under **Supabase Dashboard → Authentication → Providers → Google** as an authorized redirect URI in Google.
3. Copy the Google client ID and client secret into that Supabase Google provider and enable it.
4. Add the production site URL and `/auth/callback` URL under **Supabase Dashboard → Authentication → URL Configuration**.

Authorization remains application-controlled: Google verifies identity, while `public.profiles.role` and the approved vendor record determine access to the admin and vendor portals.
