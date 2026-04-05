# 🌌 DiscussAI - Immersive AI-Powered Group Discussions

DiscussAI is a premium, next-generation SaaS platform designed for immersive and intelligent human-AI interactions. Transform your group discussions with real-time AI experts, immersive 3D avatars, and advanced voice interaction.

![DiscussAI Hero Banner](https://via.placeholder.com/1200x400/0f172a/6366f1?text=DiscussAI+-+Immersive+AI+Discussions)

---

## ✨ Key Features

- **🎭 Immersive 3D Avatars**: Life-like visual representations of AI personas, synchronized with real-time speech events.
- **🎙️ Advanced Voice Mode**: Seamless, hands-free conversation with AI experts using low-latency Speech-to-Text (STT) and Text-to-Speech (TTS).
- **🧠 Persistent AI Personalities**: Configure and interact with diverse AI experts that maintain their identity and knowledge.
- **🔒 Private & Public Rooms**: Create dedicated spaces for teams or join open community discussions.
- **📊 Discussion Insights**: Real-time session summaries, history tracking, and engagement analytics.
- **💎 Premium UI/UX**: Built with a "senior designer" aesthetic featuring glassmorphism, bento grids, and fluid micro-animations.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS v4 & custom-built Standard CSS architecture
- **State Management**: React Context API
- **Form Handling**: Formik & Yup
- **Real-time**: Socket.io-client
- **Icons**: Lucide React

### Backend
- **Platform**: Node.js & Express
- **Database**: MongoDB (Mongoose)
- **Real-time Interaction**: Socket.io
- **Security**: JWT & Bcrypt
- **API Architecture**: RESTful API design

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance or Atlas)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Raju-kushwaha1230/DiscussAi.git
   cd DiscussAi
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Create a .env file and configure necessary variables
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## ⚙️ Configuration

### Backend `.env`
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
# Additional keys for AI models and voice services
```

### Frontend Configuration
The frontend connects to the backend at `http://localhost:5000` by default. Update the API base URL in the Axios configuration if necessary.

---

## 📂 Project Structure

```text
DiscussAI/
├── frontend/           # React frontend (Vite)
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Application screens
│   │   └── context/    # Authentication & Room state
├── backend/            # Express backend
│   ├── models/         # Database schemas
│   ├── routes/         # API endpoints
│   └── controllers/    # Business logic
└── README.md           # You are here!
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue.

---

<p align="center">Made with ❤️ for the future of AI Communication</p>
