# Todo API

A secure and scalable Todo API built with Next.js and Supabase.

## Features

- User authentication with Supabase Auth
- Secure token management with automatic refresh
- Row Level Security (RLS) for data protection
- Task management with user-specific access
- RESTful API endpoints

## Tech Stack

- Next.js 14
- TypeScript
- Supabase (Auth, Database, RLS)
- Zod for validation
- HTTP-only cookies for refresh tokens

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   JWT_SECRET=your_jwt_secret
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Tasks

- `GET /api/tasks` - Get user's tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

## Security Features

- Supabase Auth for user management
- Row Level Security (RLS) for data access control
- HTTP-only cookies for refresh tokens
- Automatic token refresh in middleware
- Database-level security with triggers

## Database Structure

### Tasks Table

```sql
create table tasks (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  status text default 'pending',
  priority text default 'medium',
  due_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id) not null
);
```

### RLS Policies

```sql
-- Enable RLS
alter table tasks enable row level security;

-- Create policy for all operations
create policy "Users can manage their own tasks" on tasks
  for all
  to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);
```

## Token Management

- Access tokens are stored in localStorage
- Refresh tokens are stored in HTTP-only cookies
- Automatic token refresh in middleware
- Access token lifespan: 1 hour
- Refresh token lifespan: 1 year

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.
