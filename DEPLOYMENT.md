# Vercel Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables
Before deploying to Vercel, ensure all required environment variables are set in your Vercel project settings:

```
DATABASE_URL=your_supabase_connection_string
DIRECT_URL=your_supabase_direct_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_ENV=production
BILLPLZ_API_SECRET_KEY=your_billplz_secret
BILLPLZ_API_URL=your_billplz_url
BILLPLZ_X_SIGNATURE_KEY=your_billplz_signature_key
BILLPLZ_COLLECTION_ID=your_collection_id
```

### 2. Database Setup
- Ensure your Supabase database is properly configured
- Run any pending migrations if needed
- Verify all tables and schemas are in place

### 3. Build Configuration
The project is configured with:
- **Build Command**: `prisma generate && next build`
- **Output Directory**: `.next`
- **Framework**: Next.js 16 with Turbopack

## Deployment Steps

### Via Vercel CLI:
```bash
npm install -g vercel
vercel deploy
```

### Via Vercel Dashboard:
1. Connect your GitHub repository to Vercel
2. Add all environment variables in Project Settings
3. Vercel will automatically detect Next.js and build accordingly
4. Click "Deploy"

## Post-Deployment

### Verify Deployment:
- Check that the app loads without 307 errors
- Verify authentication flow works
- Test critical user paths (login, dashboard, etc.)
- Check error logs in Vercel dashboard if issues occur

### Troubleshooting:

**307 Errors:**
- These are typically redirect responses - check that redirects aren't happening during build
- Clear Vercel cache and redeploy
- Verify all environment variables are correctly set

**Build Failures:**
- Check Vercel build logs for specific errors
- Ensure Prisma client is generated: `prisma generate`
- Verify Node.js version compatibility (Node 18+ recommended)

**Runtime Errors:**
- Check Vercel Function logs
- Verify database connection strings are correct
- Ensure Supabase is accessible from Vercel

## Key Files Modified for Deployment

1. **next.config.ts** - Simplified for better ES module compatibility
2. **app/layout.tsx** - Added proper background styling
3. **components/password-setup-guard.tsx** - Fixed client-side redirect handling
4. **vercel.json** - Added deployment configuration
5. **app/(protected)/layout.tsx** - Removed unnecessary Prisma imports from layout

## Production Recommendations

1. **Enable Vercel Analytics** - Monitor performance metrics
2. **Setup Error Tracking** - Use Sentry or similar for production errors
3. **Configure Domain** - Add your custom domain in Vercel settings
4. **Setup HTTPS** - Vercel provides free SSL certificates
5. **Enable Preview Deployments** - For staging environment testing

## Important Notes

- The application requires Node.js 18 or higher
- Turbopack is enabled for faster builds
- All dynamic routes are server-rendered on demand
- Ensure your Supabase project has Row-Level Security properly configured
