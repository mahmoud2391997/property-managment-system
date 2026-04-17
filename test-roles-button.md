# Fixing Roles Button Issue

## Problem Analysis
The roles button in the staff page is not working. Based on investigation:

1. **Authentication Issue**: Staff page redirects to `/login` - user needs to be logged in
2. **API Response Issue**: API calls returning HTML instead of JSON
3. **Permission Check Issue**: `ManageRolesButton` might be returning null

## Step-by-Step Solution

### 1. Test Authentication
```bash
# Login via browser first
# Go to http://localhost:4000/login
# Use credentials: staffuser0@example.com / ChangeMe123!
```

### 2. Test Roles Button
After successful login:
1. Navigate to `/staff` 
2. Look for "Manage Roles" button in top right
3. Click the button - should navigate to `/staff/roles`

### 3. Debug If Still Not Working

Check browser console for errors:
- Press F12 → Console tab
- Look for any JavaScript errors
- Check Network tab for failed requests

### 4. Verify Permissions
The Owner role should have `roles.access` permission. Check:
- Go to `/staff/roles` 
- Should see roles management interface
- Should be able to create/edit roles

### 5. Alternative Test
If button still doesn't work, test direct URL:
- Go directly to `http://localhost:4000/staff/roles`
- If this works, the issue is with the button/link
- If this redirects to login, the issue is with permissions

## Expected Behavior
- ✅ User sees "Manage Roles" button (if has `roles.access` permission)
- ✅ Button navigates to `/staff/roles` when clicked
- ✅ Roles management page loads and shows existing roles
- ✅ Can create new roles and assign permissions

## If Issues Persist
1. **Check Database**: Run `bun run seed:owner-role` to ensure permissions are set
2. **Check Cache**: Restart dev server to clear any permission cache issues
3. **Check Browser**: Clear browser cache and try incognito mode

## Test Users
| Role | Email | Password | Expected |
|------|-------|----------|----------|
| Owner | staffuser0@example.com | ChangeMe123! | Should see button |
| Property Manager | propertymanager@example.com | Test123456! | Should see button |
| Finance Manager | financemanager@example.com | Test123456! | Should NOT see button |
