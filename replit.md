# ISG Report System

## Overview

This is a Turkish occupational health and safety (İş Sağlığı ve Güvenliği - İSG) report management system. The application allows users to create, manage, and track workplace safety inspection reports with findings, images, and risk assessments. The system supports offline functionality with automatic synchronization when connectivity is restored.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system and CSS variables for theming
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation through @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JWT-based authentication
- **Middleware**: Custom request logging, error handling, and authentication middleware
- **File Uploads**: Multer for handling multipart form data with Sharp for image processing

### Data Storage Solutions
- **Database**: PostgreSQL accessed through Neon serverless
- **ORM**: Drizzle ORM with type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Offline Storage**: Browser localStorage for offline queue management and data persistence

### Authentication and Authorization
- **Strategy**: JWT (JSON Web Tokens) for stateless authentication
- **Password Security**: bcrypt for password hashing
- **Token Storage**: localStorage for client-side token persistence
- **Protected Routes**: Middleware-based route protection with user context injection

### Key Features and Design Patterns
- **Offline-First Design**: Local data persistence with background synchronization
- **Progressive Enhancement**: Core functionality works offline with enhanced features online
- **Responsive Design**: Mobile-first approach with Tailwind CSS breakpoints
- **Type Safety**: End-to-end TypeScript with shared schema definitions
- **Error Handling**: Comprehensive error boundaries and user feedback through toast notifications

### Data Models
- **Users**: Authentication and user management with full name and username
- **Reports**: Safety inspection reports with metadata, status tracking, and summary fields
- **Findings**: Individual safety issues within reports with risk levels, recommendations, and process tracking
- **Offline Queue**: Background synchronization queue for offline operations

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe SQL query builder and ORM
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Headless UI primitives for accessible components

### File Storage and Processing
- **@google-cloud/storage**: Cloud storage integration for file uploads
- **multer**: Multipart form data handling for file uploads
- **sharp**: High-performance image processing and optimization
- **browser-image-compression**: Client-side image compression before upload

### Development and Build Tools
- **vite**: Fast development server and build tool
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Replit-specific development tooling
- **esbuild**: Fast JavaScript bundler for production builds

### UI and Styling
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant management for components
- **lucide-react**: Icon library with React components
- **wouter**: Lightweight client-side routing

### Validation and Forms
- **zod**: TypeScript-first schema validation
- **react-hook-form**: Performant forms with minimal re-renders
- **@hookform/resolvers**: Validation resolver integration

### Authentication and Security
- **jsonwebtoken**: JWT token generation and verification
- **bcrypt**: Password hashing and comparison