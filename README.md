# CatGPT - Advanced ChatGPT Clone

A pixel-perfect, full-stack ChatGPT clone built with modern technologies, featuring multiple AI models, file uploads, conversation memory, and real-time streaming responses.

**NOTE** : AUTOMATION IS THE KEY. ALL DOCUMENTATIONS ARE WRITTEN BY AI. Comments are also written by AI.

## 🚀 Features

### 🤖 AI Integration

- **Multiple AI Models**: Support for GPT-3.5, GPT-4, Claude (Anthropic), and Gemini (Google)
- **Streaming Responses**: Real-time AI responses with typing indicators
- **Memory System**: Persistent conversation memory using Mem0 AI
- **Custom System Prompts**: Personalized AI behavior and context
- **Token Tracking**: Usage monitoring and optimization

### 💬 Chat Experience

- **Real-time Conversations**: Instant messaging with AI models
- **Message Editing**: Edit and regenerate AI responses
- **Conversation Branching**: Multiple response alternatives
- **Auto-generated Titles**: Smart conversation naming
- **Conversation Management**: Archive, search, and organize chats
- **Markdown Support**: Rich text formatting with syntax highlighting

### 📁 File Management

- **Multi-format Upload**: PDF, images, documents support
- **Cloud Storage**: Integrated with Cloudinary
- **File Analysis**: PDF text extraction and image processing
- **Drag & Drop**: Intuitive file upload interface
- **File Association**: Link files to specific messages and conversations

### 🔐 Authentication & Security

- **Clerk Integration**: Secure authentication with social login
- **JWT Tokens**: Stateless authentication
- **Role-based Access**: Subscription tiers (free, pro, enterprise)
- **Data Privacy**: Encrypted data transmission and storage
- **Rate Limiting**: API protection and abuse prevention

### 🎨 User Interface

- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Dark/Light Theme**: Customizable appearance
- **Modern UI**: Clean design with smooth animations
- **Accessibility**: WCAG compliant with keyboard navigation
- **Progressive Web App**: Installable with offline capabilities

## 🏗️ Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Clerk** - Authentication and user management
- **Axios** - HTTP client for API requests
- **React Hook Form** - Form management with validation

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **Clerk** - Authentication middleware
- **Winston** - Logging system
- **Cloudinary** - File storage and processing
- **Swagger** - API documentation

### AI & Services

- **OpenAI API** - GPT models integration
- **Anthropic API** - Claude models
- **Google AI** - Gemini models
- **Mem0 AI** - Conversation memory system

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB database
- Clerk account for authentication
- AI API keys (OpenAI, Anthropic, Google)
- Cloudinary account for file storage
- Mem0 account for memory features

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/galaxy-assignment.git
cd galaxy-assignment
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Add your API keys and configuration

# Start backend server
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Create .env.local file
cp .env.example .env.local
# Add your environment variables

# Start frontend development server
npm run dev
```

### 4. Environment Variables

#### Backend (.env)

```bash
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/chatgpt-clone
CLERK_SECRET_KEY=your_clerk_secret_key
CORS_ORIGIN=http://localhost:3000
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_API_KEY=your_google_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
MEM0_API_KEY=your_mem0_api_key
```

#### Frontend (.env.local)

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

## 📁 Project Structure

```bash
galaxy-assignment/
├── backend/                 # Node.js/Express API
│   ├── controllers/        # Request handlers
│   ├── models/            # Database schemas
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── middleware/        # Custom middleware
│   ├── utils/             # Helper functions
│   ├── app.js             # Express app configuration
│   ├── server.js          # Server entry point
│   └── swagger.yaml       # API documentation
├── frontend/               # Next.js React app
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── lib/               # Utility functions
│   ├── public/            # Static assets
│   └── middleware.ts      # Next.js middleware
└── docs/                  # Documentation
    ├── BACKEND.md         # Backend documentation
    ├── FRONTEND.md        # Frontend documentation
    └── README.md          # This file
```

## 🛠️ Development

### API Documentation

- Backend API documentation is available at `http://localhost:3001/docs`
- Interactive Swagger UI with all endpoints and schemas
- Complete OpenAPI 3.0 specification

### Code Quality

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Husky for git hooks (to be configured)

## 🌐 Deployment

### Backend Deployment

- Configure production environment variables
- Set up MongoDB Atlas or preferred database
- Deploy to services like Railway, Render, or AWS
- Configure CORS for production domain

### Frontend Deployment

- Configure production environment variables
- Deploy to Vercel, Netlify, or similar platforms
- Set up custom domain and SSL
- Configure authentication redirects

## 🔧 Configuration

### AI Models

Configure available AI models in backend services:

- OpenAI: GPT-3.5-turbo, GPT-4, GPT-4-turbo
- Anthropic: Claude-3-sonnet, Claude-3-opus
- Google: Gemini-pro, Gemini-pro-vision

### File Upload Limits

- Maximum file size: 10MB
- Supported formats: PDF, JPG, PNG, GIF
- Cloudinary transformations for optimization

### Database Indexing

- User queries optimized with compound indexes
- Conversation and message queries optimized
- Full-text search capabilities

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm test           # Run unit tests
npm run test:e2e   # Run end-to-end tests (to be implemented)
```

### Frontend Testing

```bash
cd frontend
npm test           # Run Jest tests (to be implemented)
npm run test:e2e   # Run Playwright tests (to be implemented)
```

## 📈 Performance

### Optimization Features

- **Backend**: Request caching, database indexing, response compression
- **Frontend**: Code splitting, image optimization, lazy loading
- **Real-time**: WebSocket connections for instant messaging
- **CDN**: Cloudinary for global file delivery

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT models and inspiration
- Clerk for authentication solutions
- Vercel for Next.js framework
- MongoDB for database solutions
- All open-source contributors

## 📞 Support

For support, email <support@galaxy-assignment.com> or create an issue on GitHub.

## 🗺️ Roadmap

- [ ] Voice messaging and transcription
- [ ] Real-time collaboration features
- [ ] Advanced file processing (Excel, PowerPoint)
- [ ] Custom AI model fine-tuning
- [ ] Mobile app development
- [ ] API rate limiting dashboard
- [ ] Advanced analytics and insights
