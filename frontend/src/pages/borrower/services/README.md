# Borrower Services Layer - Backend Integration Guide

## Overview

The borrower panel now uses a **service layer architecture** that makes backend integration seamless. All data operations go through service functions that handle API calls, caching, and offline fallbacks automatically.

## Architecture Pattern

```
Component → Service Layer → API Layer → Backend
                ↓
         localStorage (cache/fallback)
```

### Key Principles

1. **Components never call API or localStorage directly** - They use service functions
2. **Service layer handles all persistence** - localStorage is used as cache/fallback
3. **Network errors are handled gracefully** - Offline-first behavior with localStorage fallback
4. **Backend integration is transparent** - Just update API endpoints, services handle the rest

## Service Layer Structure

All services are located in `frontend/src/pages/borrower/services/`:

- `profileService.js` - Profile management
- `organizationService.js` - Organization and team management
- `securityService.js` - Security settings, 2FA, sessions
- `notificationService.js` - Notification preferences
- `userManagementService.js` - User CRUD operations
- `moduleSettingsService.js` - Module configuration

## Service Pattern

Every service function follows this pattern:

```javascript
async function getData() {
  try {
    // 1. Try API call first
    const res = await borrowerApi.getData()
    const data = res?.data?.data ?? res?.data
    
    // 2. On success: update localStorage as cache
    settingsStorage.setData(data)
    return data
  } catch (err) {
    // 3. On network error: use localStorage as fallback
    if (err?.code === 'ERR_NETWORK' || err?.isOffline) {
      const cached = settingsStorage.getData()
      return cached || fallbackData
    }
    // 4. On other errors: try cache, then throw
    const cached = settingsStorage.getData()
    if (cached) return cached
    throw err
  }
}
```

## API Endpoints

All API endpoints are defined in `frontend/src/pages/borrower/api.js`:

### Profile
- `GET /api/borrower/profile` - Get profile
- `PATCH /api/borrower/profile` - Update profile
- `POST /api/borrower/profile/photo` - Upload profile photo

### Organization
- `GET /api/borrower/organization` - Get organization
- `PATCH /api/borrower/organization` - Update organization
- `POST /api/borrower/organization/team/invite` - Invite team member
- `PATCH /api/borrower/organization/team/:memberId` - Update team member
- `DELETE /api/borrower/organization/team/:memberId` - Remove team member

### Security
- `GET /api/borrower/security` - Get security settings
- `PATCH /api/borrower/security` - Update security settings
- `POST /api/borrower/security/change-password` - Change password
- `PATCH /api/borrower/security/two-factor` - Toggle 2FA
- `GET /api/borrower/security/sessions` - Get active sessions
- `DELETE /api/borrower/security/sessions/:sessionId` - Revoke session
- `POST /api/borrower/security/sessions/revoke-all` - Revoke all other sessions

### Notifications
- `GET /api/borrower/notifications/preferences` - Get preferences
- `PATCH /api/borrower/notifications/preferences` - Update preferences

### User Management
- `GET /api/borrower/users` - List users
- `POST /api/borrower/users` - Create user
- `GET /api/borrower/users/:userId` - Get user details
- `PATCH /api/borrower/users/:userId` - Update user
- `DELETE /api/borrower/users/:userId` - Delete user

### Module Settings
- `GET /api/borrower/module-settings` - Get module settings
- `PATCH /api/borrower/module-settings` - Update module settings

### Access Control
- `GET /api/borrower/roles` - List roles
- `POST /api/borrower/roles` - Create role
- `GET /api/borrower/roles/:roleId` - Get role details
- `PATCH /api/borrower/roles/:roleId` - Update role
- `DELETE /api/borrower/roles/:roleId` - Delete role

### Integrations
- `GET /api/borrower/integrations` - List integrations
- `POST /api/borrower/integrations/:integrationId/connect` - Connect integration
- `DELETE /api/borrower/integrations/:integrationId/disconnect` - Disconnect integration

## Backend Integration Steps

### 1. Update API Base URL

Set environment variable `VITE_API_BASE_URL` or update `api.js`:

```javascript
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
```

### 2. Implement Backend Endpoints

Implement the endpoints listed above. Expected request/response formats:

**Profile Update:**
```json
// Request
PATCH /api/borrower/profile
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+61 4XX XXX XXX"
}

// Response
{
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+61 4XX XXX XXX",
    "memberSince": "2024-01-01",
    "accountType": "Professional",
    "verified": true
  }
}
```

**Organization Update:**
```json
// Request
PATCH /api/borrower/organization
{
  "formData": {
    "name": "Acme Corp",
    "abn": "12 345 678 901",
    "industry": "Financial Services",
    ...
  },
  "teamMembers": [...]
}

// Response
{
  "data": {
    "formData": {...},
    "teamMembers": [...]
  }
}
```

### 3. Authentication

The API layer automatically includes auth token from localStorage:

```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

Ensure your backend validates this token.

### 4. Error Handling

The service layer handles:
- **Network errors** (`ERR_NETWORK`) - Falls back to localStorage
- **Other errors** - Throws error for component to handle

Backend should return appropriate HTTP status codes:
- `200` / `201` - Success
- `400` - Bad request (validation errors)
- `401` - Unauthorized
- `404` - Not found
- `500` - Server error

### 5. Response Format

Services expect responses in one of these formats:

```javascript
// Format 1: Nested data
{ "data": { ...actualData } }

// Format 2: Direct data
{ ...actualData }

// Format 3: Array
[ ...items ]
```

Services handle all formats automatically.

## Testing Backend Integration

1. **Start your backend** on `http://localhost:8000` (or set `VITE_API_BASE_URL`)
2. **Set auth token** in localStorage: `localStorage.setItem('authToken', 'your-token')`
3. **Test each service** - Components will automatically use backend when available
4. **Test offline** - Disconnect backend, app should use localStorage fallback

## Benefits

✅ **No refactoring needed** - Components already use service layer  
✅ **Offline-first** - Works without backend using localStorage  
✅ **Automatic caching** - localStorage updated on successful API calls  
✅ **Graceful degradation** - Network errors don't break the UI  
✅ **Easy testing** - Mock services or use localStorage fallback  
✅ **Future-proof** - Add new endpoints without touching components

## Migration Checklist

- [x] Service layer created
- [x] All components refactored to use services
- [x] API endpoints defined
- [x] localStorage fallback implemented
- [x] Error handling in place
- [ ] Backend endpoints implemented
- [ ] Backend authentication configured
- [ ] Backend response format matches expected format
- [ ] Integration tested end-to-end

## Notes

- **localStorage keys** are managed by `settingsStorage.js` - don't change them
- **Photo uploads** use FormData - backend should handle multipart/form-data
- **Password changes** are NOT cached for security reasons
- **Sessions** are cached but should be refreshed periodically
