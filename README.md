# 🧩 E.M.I.T.
**Event Messaging & Instant Termination**  
*"Chat fast, gone in a flash — messages vanish when you’re caught!"*

---

## ⚡ Overview
E.M.I.T. is a real-time web chat application built with Socket.IO, Node.js/Express, MongoDB, and React.  
It supports one-on-one and group chats with persistent history, message deletion/clearing, presence, and a configurable censorship system (Unicode-friendly, e.g., Thai).  
“Message Vanish Mode” lets messages disappear instantly when triggered, adding a playful twist.

---

## 🛠 Features
- Real-time messaging (Socket.IO)
- Direct (1:1) and Group chats, each with its own room
- Message history persistence (MongoDB)
- Delete single message and clear conversation (DM + Group)
- Online users list (presence)
- Groups: create, list (with members), join, and chat
- Censorship system:
  - Add/remove censored words
  - Unicode-aware substring matching (Thai supported)
  - Visual black labels in UI replace censored terms
- Robust connection management (prevents duplicate socket connections)

---

## ⚙️ Tech Stack
- Backend: Node.js, Express, Socket.IO, Mongoose (MongoDB)
- Frontend: React (CRA)
- Auth: JWT

---

## 📦 Monorepo Structure
```
chat-project/
  server/   # Express + Socket.IO + MongoDB (Mongoose)
  client/   # React app
```

---

## 🔧 Environment Variables
Create server/.env:
```
MONGO_URI=mongodb://localhost:27017/chat-project
JWT_SECRET=change_me
CLIENT_ORIGIN=http://localhost:3000
PORT=3001
```

Optional client/.env (if you need an explicit server URL/IP):
```
REACT_APP_SERVER_URL=http://localhost:3001
```

---

## 🚀 Install & Run (macOS)
- Terminal 1 (server):
```bash
cd server
npm install
npm start
```
- Terminal 2 (client):
```bash
cd client
npm install
npm start
```
Open http://localhost:3000 in your browser.

---

## 🌐 Multi‑Machine Run
Run the server on one machine and connect clients from others.

1) Find server machine IP (macOS):
```bash
ipconfig getifaddr en0   # or en1 depending on your adapter
```
2) On each client machine, set client/.env:
```
REACT_APP_SERVER_URL=http://<SERVER_IP>:3001
```
3) Restart the client apps and log in with different usernames.

---

## 🧭 How It Works (High Level)
- Direct chat:
  - start_chat → server responds with chat_history
  - send_message → server persists and emits new_message to the 1:1 room
- Group chat:
  - Create group → broadcast groups_updated
  - Join group → server updates membership and broadcasts groups_updated
  - join_group → server responds with group_history
  - send_group_message → server persists and emits group_new_message to the group room
- Deletion/Clearing:
  - delete_message / clear_chat (DM) and delete_group_message / clear_group_chat (Group)
  - Server emits message_deleted/chat_cleared (DM) or group_message_deleted/group_chat_cleared (Group)
- Censorship:
  - Manage via REST (GET/POST/DELETE /api/chat/censor)
  - Client renders censored words as black labels (Unicode substring match)

---

## 🔌 Socket Events (Core Transport)
Client → Server:
- user_connected
- start_chat, send_message
- join_group, send_group_message
- delete_message, clear_chat
- delete_group_message, clear_group_chat

Server → Client:
- chat_history, new_message, message_deleted, chat_cleared
- group_history, group_new_message, group_message_deleted, group_chat_cleared
- groups_updated
- censor_updated

---

## 🌐 REST Endpoints (Auxiliary)
- Auth:
  - POST /api/auth/register
  - POST /api/auth/login
- Direct chat:
  - GET /api/chat/history/:other
  - DELETE /api/chat/message/:id
  - DELETE /api/chat/history/:other
- Groups:
  - GET /api/chat/groups
  - POST /api/chat/groups
  - POST /api/chat/groups/:id/join
  - (If enabled) DELETE /api/chat/groups/:id/messages/:msgId
  - (If enabled) DELETE /api/chat/groups/:id/history
- Censor:
  - GET /api/chat/censor
  - POST /api/chat/censor
  - DELETE /api/chat/censor/:id

Note: Real-time chat delivery uses sockets; REST supports listing/history/management.

---

## 🧪 Quick Test Plan
1) Register two users; verify both appear online in the Lobby.
2) Direct chat: click a user, exchange messages; delete one; clear the chat.
3) Groups: create a group; from another user, join it; exchange messages; delete one; clear history.
4) Censor: add a Thai word; send it in chat; verify it’s visually censored.

---

## 🛡️ Notes
- Configure CORS via CLIENT_ORIGIN in server/.env for cross-host clients.
- Ensure MongoDB is reachable (local or Atlas).
- Default ports: server 3001, client 3000.
