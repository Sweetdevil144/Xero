# Backend Documentation - CatGPT API

## Overview

The backend is a robust Node.js/Express API for a ChatGPT clone with advanced features including AI chat, file uploads, memory functionality, and real-time streaming responses.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Clerk
- **AI Integration**: Multiple providers (OpenAI, Anthropic, Google)
- **File Storage**: Cloudinary
- **Memory**: Mem0 AI for conversation memory
- **Security**: Helmet, CORS, rate limiting
- **Logging**: Winston with custom colored logging
- **Documentation**: Swagger/OpenAPI 3.0

## Project Structure

### Core Files

- **`server.js`** - Main server entry point, starts the application on port 3001
- **`app.js`** - Express application configuration with middleware, routes, and database connection
- **`package.json`** - Dependencies and scripts configuration

### Routes (`/routes`)

- **`auth.js`** - Authentication routes for user management
- **`chat.js`** - Chat conversation endpoints
- **`files.js`** - File upload and management routes
- **`users.js`** - User profile and preferences management
- **`health.js`** - Health check endpoints for monitoring

### Controllers (`/controllers`)

- **`authController.js`** - User authentication and profile logic
- **`chatController.js`** - Main chat functionality, AI integration, streaming responses
- **`fileController.js`** - File upload, processing, and retrieval logic

### Models (`/models`)

- **`User.js`** - User schema with Clerk ID, preferences, subscription, and usage tracking
- **`Conversation.js`** - Chat conversation schema with metadata and archiving
- **`Message.js`** - Individual message schema with role, content, files, and edit history
- **`File.js`** - File metadata schema with Cloudinary integration

### Services (`/services`)

- **`aiService.js`** - AI provider integration (OpenAI, Anthropic, Google) with streaming
- **`chatService.js`** - Chat logic, conversation management, and message processing
- **`fileService.js`** - File processing, PDF parsing, image analysis, and Cloudinary uploads

### Middleware (`/middleware`)

- **`auth.js`** - Clerk authentication middleware
- **`errorHandler.js`** - Global error handling and response formatting

### Utilities (`/utils`)

- **`logger.js`** - Winston logger configuration with file and console transports

## Key Features

### Authentication & Authorization

- Clerk-based authentication with JWT tokens
- User profile management with preferences
- Subscription-based access control (free, pro, enterprise)
- Usage tracking and limits

### AI Integration

- Multiple AI model support (GPT-3.5, GPT-4, Claude, Gemini)
- Streaming responses for real-time chat experience
- Custom system prompts and conversation context
- Token counting and usage tracking
- Memory integration with Mem0 for context retention

### File Management

- Multi-format file upload support (PDF, images, documents)
- Cloudinary integration for cloud storage
- PDF text extraction and analysis
- Image processing and analysis
- File association with conversations and messages

### Chat Features

- Real-time conversation management
- Message editing and history tracking
- Conversation archiving and organization
- Custom conversation titles and metadata
- Parent-child message relationships for branching

### API Documentation

- Complete Swagger/OpenAPI 3.0 specification
- Interactive documentation at `/docs`
- Comprehensive schema definitions
- Example requests and responses

## Environment Variables

```bash
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/chatgpt-clone
CLERK_SECRET_KEY=your_clerk_secret
CORS_ORIGIN=http://localhost:3000
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
MEM0_API_KEY=your_mem0_key
```

## API Endpoints

### Authentication

- `POST /api/auth/sync` - Sync user data with Clerk
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Chat

- `GET /api/chat/conversations` - List user conversations
- `POST /api/chat/conversations` - Create new conversation
- `GET /api/chat/conversations/:id` - Get conversation details
- `POST /api/chat/conversations/:id/messages` - Send message (streaming)
- `PUT /api/chat/messages/:id` - Edit message
- `DELETE /api/chat/conversations/:id` - Delete conversation

### Files

- `POST /api/files/upload` - Upload file with processing
- `GET /api/files` - List user files
- `DELETE /api/files/:id` - Delete file

### Users

- `GET /api/users/profile` - Get detailed user profile
- `PUT /api/users/preferences` - Update user preferences
- `GET /api/users/usage` - Get usage statistics

### Health

- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system status

## Security Features

- Helmet.js for security headers
- CORS configuration for cross-origin requests
- Request rate limiting
- Input validation and sanitization
- Error handling without sensitive data exposure
- Secure file upload validation

## Monitoring & Logging

- Winston logger with multiple transports
- Colored console logging for development
- File-based logging for production
- Request logging with Morgan
- Error tracking and reporting
- Health check endpoints for monitoring

## Database Schema

- User profiles with Clerk integration
- Hierarchical conversation structure
- Message threading and editing support
- File metadata with cloud storage links
- Efficient indexing for performance
- Soft deletion for data retention
