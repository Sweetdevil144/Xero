# Frontend Documentation - CatGPT

## Overview

The frontend is a modern Next.js 15 application built with TypeScript, providing a pixel-perfect ChatGPT clone experience with advanced UI/UX features.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0
- **Authentication**: Clerk
- **UI Components**: Radix UI primitives
- **State Management**: React hooks and context
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios
- **Notifications**: Sonner (react-hot-toast)
- **Icons**: Lucide React
- **Markdown**: React Markdown with syntax highlighting
- **File Upload**: React Dropzone

## Project Structure

### Core Files

- **`next.config.ts`** - Next.js configuration with Turbopack
- **`tsconfig.json`** - TypeScript configuration
- **`tailwind.config.js`** - Tailwind CSS configuration
- **`middleware.ts`** - Next.js middleware for authentication routing
- **`components.json`** - Shadcn/ui components configuration

### App Directory (`/app`)

- **`layout.tsx`** - Root layout with Clerk provider and theme context
- **`page.tsx`** - Landing page with hero section and features
- **`globals.css`** - Global styles and Tailwind base styles
- **`chat/page.tsx`** - Main chat interface route
- **`sign-in/`** - Clerk sign-in pages
- **`sign-up/`** - Clerk sign-up pages

### Components (`/components`)

#### Chat Components (`/components/chat`)

- **`ChatInterface.tsx`** - Main chat container with sidebar and chat area
- **`ChatArea.tsx`** - Chat messages display and input area
- **`Sidebar.tsx`** - Conversation list and navigation sidebar
- **`MessageBubble.tsx`** - Individual message display with formatting
- **`MessageContent.tsx`** - Message content rendering with markdown support
- **`ModelSelector.tsx`** - AI model selection dropdown with provider options
- **`FileUpload.tsx`** - Drag-and-drop file upload component
- **`FileAttachment.tsx`** - File display and management in chat
- **`MemoryPanel.tsx`** - AI memory visualization and management
- **`TypingIndicator.tsx`** - Animated typing indicator for AI responses

#### UI Components (`/components/ui`)

- **`button.tsx`** - Reusable button component with variants
- **`input.tsx`** - Styled input component
- **`textarea.tsx`** - Auto-resizing textarea component
- **`dialog.tsx`** - Modal dialog components
- **`dropdown-menu.tsx`** - Dropdown menu with keyboard navigation
- **`avatar.tsx`** - User avatar component
- **`tooltip.tsx`** - Tooltip component with positioning
- **`scroll-area.tsx`** - Custom scrollbar component
- **`sheet.tsx`** - Slide-out panel component

### Library (`/lib`)

- **`theme-context.tsx`** - Theme provider for dark/light mode
- **`utils.ts`** - Utility functions and helpers

## Key Features

### Authentication & User Management

- Clerk integration with custom theming
- Automatic authentication routing
- User profile management
- Social login options
- Secure session handling

### Chat Interface

- Real-time streaming AI responses
- Multiple AI model support (GPT-3.5, GPT-4, Claude, Gemini)
- Conversation management and organization
- Message editing and branching
- Conversation archiving and search
- Auto-generated conversation titles

### File Management

- Drag-and-drop file uploads
- Multiple file format support
- File preview and management
- Cloud storage integration
- File association with messages

### UI/UX Features

- Responsive design for all devices
- Dark/light theme support
- Smooth animations and transitions
- Keyboard shortcuts and accessibility
- Toast notifications for user feedback
- Loading states and error handling
- Infinite scroll for conversation history

### Advanced Chat Features

- Markdown rendering with syntax highlighting
- Code block copying functionality
- Message regeneration and alternatives
- Conversation branching
- AI memory visualization
- Custom system prompts
- Model-specific settings and parameters

## Component Architecture

### State Management

- React Context for global state (theme, user preferences)
- Local component state with useState and useReducer
- Custom hooks for API interactions
- Optimistic updates for better UX

### Form Handling

- React Hook Form for form management
- Zod schema validation
- Custom form components with error handling
- File upload validation and processing

### API Integration

- Axios for HTTP requests with interceptors
- Custom hooks for API calls
- Error handling and retry logic
- Streaming response handling
- Real-time updates

## Styling System

### Tailwind Configuration

- Custom color palette matching ChatGPT
- Responsive breakpoints
- Custom animations and transitions
- Dark mode support with CSS variables
- Typography system with custom fonts

### Component Variants

- Button variants (primary, secondary, ghost, destructive)
- Input states (default, error, disabled)
- Message bubble variants (user, assistant, system)
- Loading and error states

## Responsive Design

- Mobile-first approach
- Tablet and desktop optimizations
- Collapsible sidebar for mobile
- Touch-friendly interactions
- Keyboard navigation support

## Performance Optimizations

- Next.js App Router with streaming
- Code splitting and lazy loading
- Image optimization with Next.js Image
- Memoization of expensive calculations
- Virtual scrolling for large conversation lists
- Optimistic updates for user interactions

## Accessibility Features

- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management
- Semantic HTML structure

## Environment Variables

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

## Pages & Routes

### Public Routes

- **`/`** - Landing page with hero section and feature highlights
- **`/sign-in`** - User authentication (Clerk)
- **`/sign-up`** - User registration (Clerk)

### Protected Routes

- **`/chat`** - Main chat interface
- **`/chat/[id]`** - Specific conversation view

### Authentication Flow

- Automatic redirection based on auth state
- Protected route middleware
- Session persistence
- Logout handling

## Development Features

- Hot module replacement
- TypeScript strict mode
- ESLint configuration
- Prettier code formatting
- Turbopack for fast builds
- Development error overlay

## Build & Deployment

- Static site generation where possible
- Server-side rendering for dynamic content
- Automatic image optimization
- Bundle analysis and optimization
- Progressive Web App features
- SEO optimization with metadata
