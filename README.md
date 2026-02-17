# 💻 DevStudio - Professional Code Editor & IDE

A full-stack web-based IDE with multi-language support, AI assistance, and real-time code execution.

## ✨ Features

### 🎨 **Code Editor**
- Monaco Editor integration with syntax highlighting
- Multi-language support: JavaScript, Python, C++, HTML, CSS
- Resizable split-pane layout (editor and output)
- Dark/Light mode toggle
- Line numbers, minimap, and code formatting

### ⚡ **Code Execution**
- **JavaScript**: Run directly in browser
- **Python & C++**: Execute via Piston API with input handling
- Real-time output display
- Error reporting and debugging assistance
- Input dialog for interactive programs

### 🤖 **AI Assistant**
- Powered by Groq LLM API
- Context-aware coding help
- Code examples and explanations
- Fallback responses for offline mode

### 💾 **Code Management**
- Save code to local storage
- Load saved code history
- Download code as files
- Share code with shareable links
- User authentication and cloud storage

### 👥 **Authentication**
- Secure signup/login with JWT tokens
- Password hashing with bcrypt
- Persistent user sessions
- User profile management

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **Monaco Editor** - Code editor component
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Lucide Icons** - Icon library

### Backend
- **Node.js/Express** - Server framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Groq API** - AI features
- **Piston API** - Code execution

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **MongoDB** (local or MongoDB Atlas)

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env

# Edit .env with:
# OPENAI_API_KEY=your_groq_api_key
# MONGO_URI=mongodb://127.0.0.1:27017/devstudio
# JWT_SECRET=your_secret_key

npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

Access the app at **http://localhost:3000**

## 📚 API Documentation

### Authentication
- `POST /auth/signup` - Register user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user

### Code Execution
- `POST /run` - Execute code with language, code, and optional input

### AI
- `POST /ai` - Query AI assistant

### Code Management
- `POST /code/save` - Save code to history
- `GET /code/history` - Get user's code history

### Sharing
- `POST /share` - Create shareable link
- `GET /share/:id` - Get shared code

### Health
- `GET /health` - Server health check
- `GET /db/status` - Database status

## 📁 Project Structure

```
smart-code-editor/
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── backend/
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── utils/              # Utilities
│   ├── server.js
│   ├── .env
│   └── package.json
└── README.md
```

## 🔐 Security

- JWT-based authentication
- Bcrypt password hashing
- Secure cookie storage
- CORS protection
- Environment variable management
- Input validation
- Error handling

## 🚀 Deployment

### Heroku Backend
```bash
cd backend
heroku create your-app-name
git push heroku main
```

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy the dist folder
```

## 🐛 Troubleshooting

- **Backend won't start**: Check MongoDB connection and .env file
- **Frontend can't reach backend**: Verify backend is running on port 5000
- **AI not working**: Verify OPENAI_API_KEY is set in .env
- **Code execution fails**: Check language syntax and Piston API availability

## 📝 License

MIT License - Feel free to use this project!

## 🎓 Learning Resources

- [Monaco Editor Docs](https://microsoft.github.io/monaco-editor/)
- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Tutorial](https://docs.mongodb.com/manual/)
- [Groq API Docs](https://console.groq.com/docs)

---

**Happy Coding! 🎉**
