# 🚀 Real-Time Chat Application

A modern, feature-rich real-time chat application built with **Socket.io**, **React**, **Clerk authentication**, and **shadcn/ui**. This application demonstrates bidirectional communication between clients and server with advanced features like typing indicators, read receipts, file sharing, and more.

![Chat Application](https://img.shields.io/badge/React-18.2.0-blue)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7.4-green)
![Clerk](https://img.shields.io/badge/Clerk-Authentication-orange)
![shadcn/ui](https://img.shields.io/badge/shadcn--ui-UI-blueviolet)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-3.3.5-purple)

## ✨ Features

- **Authentication with Clerk** (secure, modern, social login ready)
- **UI built with shadcn/ui** (Radix UI + Tailwind)
- **Real-time messaging** (Socket.io)
- **Multiple chat rooms, private messaging, file sharing, reactions, typing indicators, read receipts, and more**

## 🛠️ Tech Stack

- **Frontend:** React, Clerk, shadcn/ui, Tailwind CSS, Zustand, Socket.io-client
- **Backend:** Node.js, Express, Socket.io, JWT (for Clerk token validation), Multer

## 🧑‍💻 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- pnpm (recommended: `npm i -g pnpm`)
- Clerk account ([https://clerk.com/](https://clerk.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd week-5-web-sockets-assignment-Mochoni23
   ```

2. **Install server dependencies**
   ```bash
   cd server
   pnpm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   pnpm install
   ```

4. **Set up Clerk**
   - Create a project at [Clerk Dashboard](https://dashboard.clerk.com/)
   - Copy your **Publishable Key**
   - In `client/.env`, add:
     ```env
     VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key-here
     ```

5. **Start the development servers**

   **Terminal 1 - Start the server:**
   ```bash
   cd server
   pnpm run dev
   ```
   Server will run on `http://localhost:3001`

   **Terminal 2 - Start the client:**
   ```bash
   cd client
   pnpm run dev
   ```
   Client will run on `http://localhost:3000`

6. **Open your browser**
   Navigate to `http://localhost:3000` to access the application

## 🧩 Clerk Authentication
- All authentication is handled by Clerk (no custom login/register pages)
- Users must sign in with Clerk to access chat
- Clerk JWT is used for secure Socket.io connections
- User info (avatar, name, email) is provided by Clerk

## 🎨 UI with shadcn/ui
- All major UI components use shadcn/ui primitives (Button, Input, Card, etc.)
- Easily customizable and accessible

## 📁 Project Structure

```
socketio-chat/
├── client/                 # React front-end
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # UI components (shadcn/ui)
│   │   ├── pages/          # Page components
│   │   ├── store/          # State management
│   │   ├── socket/         # Socket.io client setup
│   │   └── App.jsx         # Main application component
│   └── package.json        # Client dependencies
├── server/                 # Node.js back-end
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Middleware functions
│   ├── models/             # Data models
│   ├── socket/             # Socket.io server setup
│   ├── utils/              # Utility functions
│   ├── server.js           # Main server file
│   └── package.json        # Server dependencies
└── README.md               # Project documentation
```

## 🔒 Security
- Clerk JWT is validated on every socket connection
- No passwords are stored in the client
- All sensitive logic is handled by Clerk and the server

## 📱 Mobile Support
- Fully responsive UI
- Works on all modern browsers and devices

## 🤝 Contributing
- Fork, branch, and PR as usual!

---

**Built with ❤️ using pnpm, Clerk, shadcn/ui, and Socket.io** 