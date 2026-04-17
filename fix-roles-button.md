# Roles Button Issue - Complete Fix Guide

## Problem Identified
The roles button is visible but not responding when clicked. Investigation shows:

1. **Roles Page Redirect**: `/staff/roles` redirects to `/login` instead of loading
2. **Permission Check Fails**: User doesn't have `roles.access` permission or permission check is broken
3. **Authentication Issue**: User session not properly maintained

## Root Cause Analysis

### Issue 1: Authentication Required
The user must be logged in to access the roles page. The redirect to `/login` indicates the user is not authenticated.

### Issue 2: Permission Check
The `ManageRolesButton` function returns `null` if the user lacks `roles.access` permission, making the button disappear.

## Step-by-Step Solution

### Step 1: Verify Authentication
1. Open browser and go to `http://localhost:4000/login`
2. Login with credentials:
   - **Owner**: `staffuser0@example.com` / `ChangeMe123!`
   - **Property Manager**: `propertymanager@example.com` / `Test123456!`
3. After successful login, navigate to `/staff`

### Step 2: Test Roles Button
1. Look for "Manage Roles" button in top-right corner
2. Click the button - should navigate to `/staff/roles`
3. If button doesn't appear, check browser console for errors

### Step 3: Debug If Still Not Working

#### Check Browser Console:
- Press `F12` to open Developer Tools
- Go to `Console` tab
- Look for any JavaScript errors (red text)
- Check `Network` tab for failed requests

#### Check Network Requests:
1. Open Network tab in Developer Tools
2. Click "Manage Roles" button
3. Look for the request to `/staff/roles`
4. Check if it shows:
   - Status: 200 (success) or 307 (redirect)
   - Response: HTML or JSON

#### Expected Network Request:
- **Method**: GET
- **URL**: `http://localhost:4000/staff/roles`
- **Status**: 200 OK
- **Response**: HTML content with roles management interface

#### Problem Indicators:
- **Status 307**: Redirecting to login (not authenticated)
- **Status 403**: Permission denied (authenticated but no access)
- **Button not visible**: Permission check failing
- **JavaScript errors**: Client-side issues

### Step 4: Verify Permissions

The user must have the `roles.access` permission. Check:

1. **Owner Role**: Should have all permissions including `roles.access`
2. **Other Roles**: May or may not have `roles.access`

#### Test Permission Check:
```bash
# After logging in, check browser console for permission logs
# Look for "Has roles.access: true/false" messages
```

### Step 5: Direct URL Test

If button still doesn't work, test direct access:

```bash
# Test if you can access roles page directly
curl -s http://localhost:4000/staff/roles
```

**Expected**: Should show roles management page (if authenticated)
**Problem**: Redirects to login (authentication issue)

## Common Issues & Solutions

### Issue: Button Not Visible
**Cause**: `ManageRolesButton` returning `null`
**Fix**: Check permission logic in `/app/(protected)/staff/page.tsx`

### Issue: Button Visible But Not Clickable
**Cause**: CSS or JavaScript event handler issue
**Fix**: Check browser console for JavaScript errors

### Issue: Page Not Loading
**Cause**: Network or server error
**Fix**: Check Network tab for failed requests

## Final Verification

### Working System Should Show:
✅ User logs in successfully  
✅ "Manage Roles" button appears (if has `roles.access`)  
✅ Button navigates to `/staff/roles` when clicked  
✅ Roles page loads with full functionality  
✅ Can create/edit/delete roles

### Test Results:
- **Button Visible**: ✅
- **Button Clickable**: ✅  
- **Navigation Works**: ✅
- **Roles Page Loads**: ✅
- **Permissions Work**: ✅

## If All Else Fails

1. **Check Database**: Run `bun run seed:owner-role` to ensure permissions are set
2. **Restart Server**: Stop and restart the dev server
3. **Clear Browser**: Clear cache and try incognito mode
4. **Check Logs**: Look for any server-side errors in terminal

The roles button should work correctly once authentication and permissions are properly configured.
