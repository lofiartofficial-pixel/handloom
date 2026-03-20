# 🚀 Sari Vikunu - Vercel Deployment Guide

## Prerequisites Checklist

Before deploying:
- [ ] Supabase project created
- [ ] All SQL files run (supabase-schema.sql + functions.sql + rls-and-indexes.sql + concurrency.sql)
- [ ] .env.local filled with all values
- [ ] GitHub repo with all code pushed
- [ ] Resend account + API key (resend.com - free tier works)
- [ ] PayHere merchant account (optional - WhatsApp orders work without)

---

## Step 1: Push to GitHub

```bash
cd sari-vikunu
git init
git add .
git commit -m "Initial commit - Sari Vikunu"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sari-vikunu.git
git push -u origin main
```

---

## Step 2: Deploy to Vercel

1. Go to **vercel.com** → Sign in with GitHub
2. Click **"Add New Project"**
3. Import your `sari-vikunu` repository
4. Framework: **Next.js** (auto-detected)
5. Click **"Deploy"**

---

## Step 3: Add Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://xxx.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | eyJ... (anon key) |
| `SUPABASE_SERVICE_KEY` | eyJ... (service role key) |
| `NEXT_PUBLIC_APP_URL` | https://your-site.vercel.app |
| `RESEND_API_KEY` | re_... |
| `SHOP_EMAIL` | orders@yourdomain.com |
| `ADMIN_EMAIL` | admin@yourdomain.com |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | 94701234567 |
| `PAYHERE_MERCHANT_ID` | (from PayHere dashboard) |
| `PAYHERE_MERCHANT_SECRET` | (from PayHere dashboard) |
| `NODE_ENV` | production |

After adding variables → **Redeploy**

---

## Step 4: Update Supabase Auth Settings

In Supabase Dashboard → Authentication → URL Configuration:
- **Site URL**: `https://your-site.vercel.app`
- **Redirect URLs**: `https://your-site.vercel.app/auth/callback`

---

## Step 5: Enable Google OAuth (optional)

In Supabase → Authentication → Providers → Google:
1. Enable Google provider
2. Add Client ID + Client Secret from Google Cloud Console
3. Redirect URL: `https://xxx.supabase.co/auth/v1/callback`

---

## Step 6: Make First Admin

After first deploy, register on your site then run in Supabase SQL Editor:

```sql
UPDATE public.profiles SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your@email.com'
);
```

---

## Step 7: Update PayHere Notify URL

In PayHere Dashboard → Account Settings → Notify URL:
```
https://your-site.vercel.app/api/payments/notify
```

---

## Custom Domain (optional)

Vercel → Your Project → Settings → Domains → Add domain

For `.lk` domain:
1. Purchase at domains.lk or godaddy.com
2. Add CNAME: `www` → `cname.vercel-dns.com`
3. Add A record: `@` → `76.76.21.21`

---

## Post-Deploy Checklist

- [ ] Homepage loads correctly
- [ ] Login/Register works
- [ ] Products show (after adding some in admin)
- [ ] Cart works + WhatsApp message generates
- [ ] Admin panel accessible
- [ ] /api/health returns `{"success":true}`
- [ ] Sitemap: your-site.vercel.app/sitemap.xml

---

## Performance Tips

1. **Images**: Upload to Supabase Storage (not external URLs)
2. **Supabase**: Upgrade to Pro ($25/mo) when you get 100+ daily orders
3. **Vercel**: Free tier handles ~100k visits/month easily
4. **Speed**: Run Google PageSpeed Insights on your site after launch

---

Made with 🌸 for Sri Lankan saree businesses
