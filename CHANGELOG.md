# Changelog

## [Unreleased]

### Changed

- Replaced custom users table with Supabase's built-in authentication system
- Moved security policies to database level using Row Level Security (RLS)
- Implemented secure refresh token flow with HTTP-only cookies
- Added automatic token refresh in middleware
- Added first_name and last_name to user metadata during registration

### Added

- Database trigger to automatically set `created_by` field with `auth.uid()`
- RLS policies for task management
- Secure token refresh mechanism
- Enhanced error logging and debugging

### Removed

- Custom users table and related code
- Redundant `/refresh` endpoint
- Custom role management system
- Manual user ID verification in middleware

### Security

- Refresh tokens now stored in HTTP-only cookies
- Access tokens stored in localStorage
- Database-level security with RLS policies
- Automatic token refresh handling
- Secure user metadata storage

### Technical Details

- Access token lifespan: 1 hour (configurable in Supabase)
- Refresh token lifespan: 1 year (configurable in Supabase)
- RLS policies enforce user-specific access to tasks
- Middleware handles token verification and refresh automatically
