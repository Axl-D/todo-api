# Todo API

A Next.js API for managing tasks with authentication and Supabase integration.

## Features

- User authentication with JWT
- CRUD operations for tasks
- Pagination and filtering
- Role-based access control (admin/user)
- Supabase integration

## Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Deployment

This project is configured for deployment on Vercel. To deploy:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add the following environment variables in your Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`

## API Endpoints

### Authentication

- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login and get JWT token

### Tasks

- GET /api/tasks - Get all tasks (with pagination and filtering)
- POST /api/tasks - Create a new task
- GET /api/tasks/:id - Get a single task
- PUT /api/tasks/:id - Update a task
- DELETE /api/tasks/:id - Delete a task
