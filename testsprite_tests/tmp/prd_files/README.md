# ClubCentral

A comprehensive full-stack club management platform designed to help college clubs and organizations manage their members, events, finances, teams, and social media presence all in one place. Now with **Institution Mode** for multi-club management at the college/university level.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Authentication & Permissions](#authentication--permissions)
- [Institution Mode](#institution-mode)
- [AI Features](#ai-features)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

ClubCentral is a modern web application that streamlines club management operations for college organizations. It provides a centralized platform where club presidents, vice-presidents, committee heads, and members can collaborate effectively. The platform handles everything from member applications and approvals to event planning, task management, financial tracking, and social media scheduling.

### Key Benefits

- **Centralized Management**: All club operations in one place
- **Role-Based Access Control**: Granular permissions for different user roles
- **Member Application System**: Streamlined process for new member onboarding
- **Event & Task Management**: Plan events and assign tasks to members or teams
- **Financial Tracking**: Track income and expenses with approval workflows
- **Team Organization**: Create and manage teams with captains and members
- **Social Media Integration**: Schedule and manage social media posts
- **Institution Mode**: Multi-club management for colleges and universities
- **AI-Powered Assistance**: Generate tasks and get intelligent suggestions

## ✨ Features

### 👥 Member Management
- **Member Applications**: Prospective members can apply using a unique club code
- **Approval Workflow**: Presidents and Vice-Presidents can review and approve applications
- **Member Directory**: View all approved members with their roles and contact information
- **Role Assignment**: Assign predefined roles (President, Vice-President, Council Head, Member) or create custom roles

### 🎭 Role & Permission System
- **Predefined Roles**: President, Vice-President, Council Head, Member
- **Custom Roles**: Create roles with specific permission sets
- **Granular Permissions**: Fine-grained control over what each role can do
- **Permission Management**: Easy-to-use interface for managing role permissions

### 📅 Event Management
- **Event Creation**: Create events with details, dates, and budgets
- **Event Assignment**: Assign events to specific members
- **Status Tracking**: Track events through Planning, Ongoing, and Completed stages
- **Budget Planning**: Set and track event budgets
- **AI Task Generation**: Automatically generate tasks for events using AI

### ✅ Task Management
- **Task Creation**: Create tasks linked to events
- **Assignment Options**: Assign tasks to individual members or entire teams
- **Due Dates**: Set and track task deadlines
- **Status Updates**: Track tasks as Pending, In Progress, or Done
- **AI Assistant**: Get AI-powered task suggestions and recommendations

### 👨‍👩‍👧‍👦 Team Management
- **Team Creation**: Create teams within the club
- **Team Captains**: Assign captains to lead teams
- **Member Assignment**: Add members to teams with specific roles
- **Team Tasks**: Assign tasks to entire teams

### 💰 Financial Management
- **Transaction Tracking**: Record income and expenses
- **Receipt Management**: Upload and store receipts for transactions
- **Approval Workflow**: Financial transactions require approval from authorized members
- **Status Tracking**: Track transactions as Pending or Approved
- **Export Capabilities**: Export financial reports and data

### 📱 Social Media Management
- **Post Creation**: Create social media posts with captions and images
- **Multi-Platform Support**: Support for Instagram, Twitter, Facebook, and LinkedIn
- **Scheduling**: Schedule posts for future publication
- **Status Tracking**: Track posts as Draft, Scheduled, or Posted

### 🏛️ Committee Management
- **Vice-President Assignment**: Assign and manage vice-presidents
- **Core Member Management**: Manage committee members and their roles

### 🏢 Institution Mode (NEW)
- **Multi-Club Management**: Manage multiple clubs from a single dashboard
- **Institution Analytics**: View comprehensive analytics across all clubs
- **Department Organization**: Organize clubs by departments
- **Performance Tracking**: Track club performance with performance indices
- **Institution Users**: Manage institution-level admins, coordinators, and department heads
- **Centralized Reports**: Generate reports across all clubs
- **Club Creation**: Institution admins can create and manage clubs
- **President Assignment**: Assign presidents to clubs from institution dashboard

### 🤖 AI Features (NEW)
- **AI Task Assistant**: Generate task lists for events using AI
- **Smart Suggestions**: Get intelligent recommendations for event planning
- **Task Breakdown**: Automatically break down events into actionable tasks
- **Multiple AI Providers**: Support for Groq (LLaMA 3) and Google Gemini

### ⚙️ Settings & Configuration
- **Club Settings**: Manage club information, logo, and description
- **Club Code Management**: Generate and regenerate unique club codes for member applications
- **College Information**: Store and manage college/club details

### 📊 Dashboard
- **Overview Statistics**: View key metrics and statistics
- **Quick Actions**: Access frequently used features
- **Recent Activity**: See recent events, tasks, and updates
- **Analytics**: Visual charts and graphs for data insights

### 🎨 Landing Page
- **Modern Design**: Beautiful, responsive landing page with animations
- **Feature Showcase**: Highlight key features and benefits
- **Product Preview**: Image gallery showcasing the dashboard
- **Call-to-Action**: Clear paths to signup and login

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Wouter** - Lightweight routing
- **TanStack Query (React Query)** - Data fetching and caching
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library (Radix UI primitives)
- **Framer Motion** - Animation library
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Lucide React** - Icons
- **Recharts** - Data visualization

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database (via Neon)
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Passport.js** - Authentication middleware
- **Express Session** - Session management
- **Neon Serverless** - Serverless PostgreSQL driver

### Development Tools
- **Vite** - Build tool and dev server
- **Drizzle Kit** - Database migrations
- **ESBuild** - Production bundling
- **TypeScript** - Type checking
- **TSX** - TypeScript execution

### Additional Libraries
- **ExcelJS** - Excel file generation
- **PDFKit** - PDF generation
- **Archiver** - File compression
- **Nodemailer** - Email functionality
- **EmailJS** - Email service integration

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **PostgreSQL Database** - Either:
  - Local PostgreSQL installation, or
  - A cloud PostgreSQL service (recommended: [Neon](https://neon.tech))

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd ClubCentral_02
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
touch .env
```

Add the following environment variables to your `.env` file:

```env
# Database connection string (REQUIRED)
# For Neon PostgreSQL, get this from your Neon dashboard
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Session secret for JWT tokens (REQUIRED for production)
# Generate a strong random string for production use
SESSION_SECRET=your-secret-key-change-in-production

# Server port (optional, defaults to 5000)
PORT=5000

# Node environment (optional, defaults to development)
NODE_ENV=development

# AI API Key for Task Assistant (OPTIONAL - for AI-powered task generation)
# Get a free API key from one of these providers:
# - Groq (Recommended): https://console.groq.com/ (Free LLaMA 3 models)
# - Google Gemini: https://ai.google.dev/ (Free tier available)
# Set either GROQ_API_KEY or GEMINI_API_KEY (Groq takes precedence if both are set)
GROQ_API_KEY=your-groq-api-key-here
# OR
GEMINI_API_KEY=your-gemini-api-key-here
```

#### Getting a Database URL

**Option 1: Using Neon (Recommended for Quick Setup)**

1. Sign up for a free account at [https://neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string from the dashboard
4. Paste it into your `.env` file as `DATABASE_URL`

**Option 2: Local PostgreSQL**

1. Install PostgreSQL on your machine
2. Create a new database:
   ```sql
   CREATE DATABASE clubcentral;
   ```
3. Set the connection string:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/clubcentral
   ```

### Step 4: Initialize the Database

Push the database schema to your database:

```bash
npm run db:push
```

This command will create all necessary tables, relationships, and indexes in your database.

**Note:** If you have existing migration files in the `migrations/` directory, you may need to run them manually or ensure they're applied.

## 🏃 Running the Application

### Development Mode

Start the development server:

```bash
npm run dev
```

The application will be available at:
- **Frontend & API**: `http://localhost:5000` (or the port specified in your `.env` file)

The development server includes:
- Hot module replacement (HMR) for instant updates
- TypeScript type checking
- Error overlays
- API and frontend served from the same port

### Production Mode

1. **Build the application:**

   ```bash
   npm run build
   ```

   This will:
   - Build the React frontend
   - Bundle the Express server
   - Output everything to the `dist/` directory

2. **Start the production server:**

   ```bash
   npm start
   ```

   Make sure to set `NODE_ENV=production` in your `.env` file for production deployments.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server (requires build first) |
| `npm run check` | Run TypeScript type checking |
| `npm run db:push` | Push database schema changes to database |

## 📁 Project Structure

```
ClubCentral_02/
├── client/                      # React frontend application
│   ├── public/                 # Static assets (images, favicon)
│   │   ├── Logo.png
│   │   └── favicon.ico
│   └── src/
│       ├── components/         # Reusable React components
│       │   ├── ui/            # shadcn/ui components
│       │   ├── AIAssistant.tsx
│       │   ├── EventAITaskGenerator.tsx
│       │   ├── app-sidebar.tsx
│       │   ├── ProtectedRoute.tsx
│       │   └── StatusBadge.tsx
│       ├── pages/             # Page components (routes)
│       │   ├── Dashboard.tsx
│       │   ├── Members.tsx
│       │   ├── Events.tsx
│       │   ├── Tasks.tsx
│       │   ├── Finance.tsx
│       │   ├── Social.tsx
│       │   ├── Teams.tsx
│       │   ├── Roles.tsx
│       │   ├── Permissions.tsx
│       │   ├── Approvals.tsx
│       │   ├── Committee.tsx
│       │   ├── Settings.tsx
│       │   ├── Login.tsx
│       │   ├── Signup.tsx
│       │   ├── Apply.tsx
│       │   ├── Landing.tsx
│       │   └── institution/  # Institution mode pages
│       │       ├── Dashboard.tsx
│       │       ├── Clubs.tsx
│       │       ├── Events.tsx
│       │       ├── Finance.tsx
│       │       ├── Members.tsx
│       │       ├── Analytics.tsx
│       │       ├── Reports.tsx
│       │       └── Onboarding.tsx
│       ├── lib/               # Utilities and helpers
│       │   ├── auth.tsx       # Authentication context
│       │   ├── queryClient.ts
│       │   ├── utils.ts
│       │   ├── permissions.ts
│       │   └── design-tokens.ts
│       ├── hooks/             # Custom React hooks
│       │   ├── use-mobile.tsx
│       │   └── use-toast.ts
│       ├── types/             # TypeScript type definitions
│       │   ├── api.ts
│       │   └── ai.ts
│       ├── App.tsx            # Main app component
│       ├── main.tsx           # Entry point
│       └── index.css          # Global styles
│
├── server/                    # Express backend
│   ├── index.ts              # Server entry point
│   ├── routes.ts             # API route definitions
│   ├── storage.ts            # Database operations layer
│   ├── db.ts                 # Database connection setup
│   └── vite.ts               # Vite integration for dev
│
├── shared/                   # Shared code between frontend and backend
│   ├── schema.ts             # Database schema (Drizzle ORM)
│   └── permissions.ts        # Permission system definitions
│
├── migrations/               # Database migration files
│   ├── 20251113_add_team_id_to_tasks.sql
│   ├── 20251114_institution_mode.sql
│   └── add_president_password.sql
├── dist/                    # Production build output (generated)
├── .env                     # Environment variables (create this)
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts          # Vite configuration
├── drizzle.config.ts       # Drizzle ORM configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── components.json         # shadcn/ui configuration
```

## 🔌 API Documentation

The API follows RESTful conventions and is available at `/api/*` endpoints. All protected routes require JWT authentication via the `Authorization` header.

### Authentication Endpoints

- `POST /api/auth/signup` - Create a new club and president account
- `POST /api/auth/login` - Login and receive JWT token
- `POST /api/auth/apply/:clubCode` - Apply to join a club
- `GET /api/auth/me` - Get current user information

### Institution Mode Endpoints

- `POST /api/institution/create` - Create a new institution
- `POST /api/institution/login` - Login as institution user
- `GET /api/institution/clubs` - Get all clubs in institution
- `GET /api/institution/analytics` - Get institution analytics
- `POST /api/institution/clubs` - Create a new club (institution admin)
- `PUT /api/institution/clubs/:id` - Update club information
- `GET /api/institution/reports` - Generate institution reports

### Member Endpoints

- `GET /api/members` - Get all club members
- `GET /api/members/:id` - Get member details
- `PUT /api/members/:id` - Update member information
- `DELETE /api/members/:id` - Remove member

### Event Endpoints

- `GET /api/events` - Get all events
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Task Endpoints

- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/ai/generate` - Generate tasks using AI

### Finance Endpoints

- `GET /api/finance` - Get all financial transactions
- `POST /api/finance` - Create new transaction
- `PUT /api/finance/:id/approve` - Approve transaction
- `GET /api/finance/export` - Export financial data

### Team Endpoints

- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create new team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### Role Endpoints

- `GET /api/roles` - Get all custom roles
- `POST /api/roles` - Create new role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role

*Note: Full API documentation with request/response schemas can be found in `server/routes.ts`*

## 🗄️ Database Schema

The application uses PostgreSQL with the following main entities:

### Club-Level Tables
- **clubs** - Club information
- **users** - Approved members with login access
- **pending_members** - Member applications awaiting approval
- **roles** - Custom roles with permissions
- **events** - Club events
- **tasks** - Tasks linked to events
- **teams** - Teams within the club
- **team_members** - Team membership relationships
- **finance** - Financial transactions
- **social_posts** - Social media posts

### Institution-Level Tables
- **institutions** - Institution information (colleges/universities)
- **institution_users** - Institution-level admins and coordinators
- **institution_analytics** - Analytics snapshots for institutions

All relationships are properly defined with foreign keys and cascade deletes where appropriate.

## 🔐 Authentication & Permissions

### Authentication Flow

1. **Club Mode**: Users sign up to create a club (becoming the President) or apply to join an existing club
2. **Institution Mode**: Institution admins create institutions and manage multiple clubs
3. Applications are reviewed by Presidents/Vice-Presidents
4. Approved members receive login access
5. JWT tokens are used for session management

### Permission System

The platform uses a granular permission system:

**Predefined Club Roles:**
- **President**: Full access to all features
- **Vice-President**: All permissions except managing settings and committee (cannot change VP)
- **Council Head**: Custom permissions based on role assignment
- **Member**: Basic viewing permissions

**Available Club Permissions:**
- `manage_events` - Create, edit, and delete events
- `manage_tasks` - Create and assign tasks
- `manage_finance` - Add and view financial transactions
- `approve_finance` - Approve financial transactions
- `manage_social` - Create and schedule social posts
- `view_members` - View member information
- `manage_teams` - Create and manage teams
- `manage_committee` - Assign vice-president and manage core members
- `manage_roles` - Create and edit custom roles
- `manage_settings` - Change club settings
- `view_approvals` - View and approve member applications
- `view_dashboard_stats` - View dashboard statistics

Custom roles can be created with any combination of these permissions.

## 🏢 Institution Mode

Institution Mode allows colleges and universities to manage multiple clubs from a centralized dashboard.

### Features

- **Multi-Club Management**: View and manage all clubs in your institution
- **Institution Analytics**: Comprehensive analytics across all clubs
- **Department Organization**: Organize clubs by departments
- **Performance Tracking**: Track club performance with performance indices
- **Club Creation**: Institution admins can create new clubs
- **President Assignment**: Assign presidents to clubs
- **Centralized Reports**: Generate reports across all clubs
- **Event Monitoring**: View all events across institution clubs
- **Financial Overview**: Track finances across all clubs

### Institution Roles

- **Institution Admin**: Full control over institution and all clubs
- **Faculty Coordinator**: Can view and comment on events across all clubs
- **Department Head**: Can manage clubs within their department

### Getting Started with Institution Mode

1. Navigate to `/institution/onboarding`
2. Fill in institution details (name, type, admin information)
3. Create your institution account
4. Start managing clubs from the institution dashboard

## 🤖 AI Features

ClubCentral includes AI-powered features to help streamline event planning and task management.

### AI Task Assistant

The AI Assistant can help you:
- Generate task lists for events automatically
- Break down complex events into actionable tasks
- Get intelligent suggestions based on event details
- Refine and customize generated tasks

### Supported AI Providers

- **Groq** (Recommended): Fast, free LLaMA 3 models
- **Google Gemini**: Alternative AI provider with free tier

### Setting Up AI Features

1. Get an API key from [Groq](https://console.groq.com/) or [Google Gemini](https://ai.google.dev/)
2. Add the API key to your `.env` file:
   ```env
   GROQ_API_KEY=your-api-key-here
   # OR
   GEMINI_API_KEY=your-api-key-here
   ```
3. The AI features will be automatically available in the Events and Tasks pages

## 🐛 Troubleshooting

### "DATABASE_URL must be set" Error

**Problem:** The application cannot connect to the database.

**Solution:**
1. Ensure you have created a `.env` file in the root directory
2. Verify that `DATABASE_URL` is set correctly
3. Check that your database is accessible and running
4. For cloud databases, ensure your IP is whitelisted (if required)

### Port Already in Use

**Problem:** Port 5000 (or your specified port) is already in use.

**Solution:**
- Change the `PORT` value in your `.env` file to an available port
- Or stop the application using that port

### Database Connection Issues

**Problem:** Cannot connect to PostgreSQL database.

**Solutions:**
1. **For Neon:**
   - Verify the connection string is correct
   - Check that your Neon project is active
   - Ensure SSL mode is set correctly (`?sslmode=require`)

2. **For Local PostgreSQL:**
   - Verify PostgreSQL is running: `pg_isready` or check service status
   - Verify credentials in connection string
   - Check that the database exists
   - Ensure PostgreSQL is listening on the correct port (default: 5432)

### Schema Push Fails

**Problem:** `npm run db:push` fails.

**Solution:**
- Ensure `DATABASE_URL` is set correctly
- Check that you have write permissions on the database
- Verify the database user has CREATE TABLE permissions
- Check for existing tables that might conflict
- Review migration files in `migrations/` directory if needed

### Build Errors

**Problem:** `npm run build` fails.

**Solution:**
- Run `npm run check` to identify TypeScript errors
- Ensure all dependencies are installed: `npm install`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Authentication Issues

**Problem:** Cannot login or JWT errors.

**Solution:**
- Verify `SESSION_SECRET` is set in `.env`
- Clear browser cookies/localStorage
- Check that user account exists and `canLogin` is true
- Verify JWT token in browser DevTools Network tab

### AI Features Not Working

**Problem:** AI task generation is not working.

**Solution:**
- Verify that `GROQ_API_KEY` or `GEMINI_API_KEY` is set in `.env`
- Check that the API key is valid and has not expired
- Ensure you have API credits/quota available
- Check browser console for error messages

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Ensure type safety throughout
- Test your changes before submitting
- Follow the existing code style and structure

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Animations powered by [Framer Motion](https://www.framer.com/motion/)
- Database powered by [Neon](https://neon.tech/)

---

**Made with ❤️ for college clubs and organizations**

For questions or support, please open an issue on GitHub.
