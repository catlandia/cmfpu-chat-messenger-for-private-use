# 🔒 Private Secure Chat Messenger

A real-time, privacy-focused online chat application with auto-generated credentials and end-to-end encryption. Perfect for private 1-to-1 conversations over the internet.

## 🎯 Key Features

### No Barriers to Entry
- **No password required to access the app** - Start chatting immediately!
- **Auto-generated unique codes** - Each user gets a unique 8-character code (e.g., A1B2C3D4)
- **Auto-generated verification passwords** - Secure 12-character passwords automatically created
- **Easy to use** - Just choose a username and you're ready!

### Private 1-to-1 Chat
- **Connect via unique codes** - Add contacts by entering their unique code
- **Real-time messaging** - Instant message delivery using WebSocket technology
- **Online/offline status** - See when your contacts are available
- **Conversation history** - Messages are stored securely on the server

### Maximum Privacy
- **End-to-end encryption** - All messages encrypted with AES-256-GCM
- **Unique encryption keys** - Each user has their own encryption key derived from their password
- **Encrypted message storage** - Messages stored encrypted on the server
- **Secure credentials** - Auto-generated passwords with high entropy

## 🚀 Quick Start Guide

### Step 1: Start the Server

First, install dependencies and start the server:

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The server will start at `http://localhost:8000`

### Step 2: Create Your Account

1. Open `http://localhost:8000` in your web browser
2. Click "Create New Account"
3. Enter your desired username
4. Click "Generate My Credentials"
5. **IMPORTANT**: Save your credentials!
   - Your Unique Code (e.g., A1B2C3D4)
   - Your Verification Password
6. Click "Continue to Chat"

### Step 3: Add Contacts

1. Ask your friend to create an account and get their unique code
2. In your chat, click the "+ Add" button
3. Enter your friend's unique code
4. Start chatting privately!

### Step 4: Chat Securely

- Select a contact from your list
- Type your message and press Enter or click Send
- All messages are automatically encrypted
- See online/offline status in real-time

## 🔐 How It Works

### User Registration
1. User chooses a username
2. Server generates:
   - Unique 8-character code (crypto-secure random)
   - Secure 12-character verification password
3. Credentials displayed to user (must save them!)
4. User can now login anytime with these credentials

### Adding Contacts
1. User enters a contact's unique code
2. Server verifies the code exists
3. Both users are added to each other's contact lists
4. Can now exchange encrypted messages

### Message Encryption
1. User password derives encryption key (PBKDF2, 100k iterations)
2. Each message encrypted with AES-256-GCM
3. Unique IV (initialization vector) per message
4. Encrypted message sent to server via WebSocket
5. Server stores encrypted message
6. Recipient receives and decrypts with their own key

### Real-Time Communication
- WebSocket connection for instant delivery
- Server notifies when contacts come online/offline
- Messages delivered immediately when recipient is online
- Messages stored for offline users (delivered on login)

## 🌐 Using Online (Deploy to Internet)

To make this chat work online for people anywhere in the world:

### Option 1: Deploy to Heroku

```bash
# Install Heroku CLI, then:
heroku create your-app-name
git push heroku main
```

### Option 2: Deploy to Railway

1. Go to https://railway.app
2. Connect your GitHub repository
3. Deploy automatically

### Option 3: Deploy to Your Own Server

```bash
# On your server:
git clone your-repo
cd cmfpu-chat-messenger-for-private-use
npm install
PORT=8000 node server.js
```

Then access via your server's IP or domain name.

### Important for Online Use

- Use HTTPS (required for encryption APIs)
- Consider using a database (currently uses in-memory storage)
- Add rate limiting to prevent abuse
- Implement proper authentication tokens
- Add message expiration/cleanup

## 💻 Technical Architecture

### Backend (server.js)

- **Express.js** - Web server
- **Socket.IO** - Real-time WebSocket communication
- **In-memory storage** - Users, contacts, and messages (use database for production)

#### Key Components:
- User registration with auto-generated credentials
- Contact management system
- 1-to-1 conversation routing
- Online/offline status tracking
- Message storage and retrieval

### Frontend (index.html)

- **Vanilla JavaScript** - No framework dependencies
- **Socket.IO Client** - Real-time connection
- **Web Crypto API** - End-to-end encryption
- **Responsive Design** - Works on desktop and mobile

#### Key Features:
- Welcome/Register/Login screens
- Contact list with online status
- Real-time chat interface
- Message encryption/decryption
- Credential copy-to-clipboard

### Security Specifications

- **Unique Codes**: 8 hex characters (4 bytes entropy)
- **Passwords**: 12 characters from 70-character set
- **Encryption**: AES-256-GCM
- **Key Derivation**: PBKDF2 with SHA-256, 100,000 iterations
- **IV**: 12 bytes (96 bits) per message, randomly generated
- **Transport**: WebSocket over HTTPS (for production)

## 📱 Usage Examples

### Example 1: Two Friends Chatting

**Alice:**
1. Creates account → Gets code: `AB12CD34`
2. Shares code with Bob
3. Adds Bob's code when he shares it
4. Starts chatting!

**Bob:**
1. Creates account → Gets code: `EF56GH78`
2. Shares code with Alice
3. Adds Alice's code
4. Receives Alice's messages instantly!

### Example 2: Multiple Private Conversations

You can have separate 1-to-1 chats with different people:
- Each conversation is independent
- Messages are only visible to the two participants
- Add as many contacts as you want
- Each contact sees their own encrypted messages

## 🔒 Privacy & Security

### What's Encrypted
✅ All messages (end-to-end encrypted)
✅ Messages stored encrypted on server
✅ Each user has unique encryption key

### What's NOT Encrypted
❌ Usernames (visible to server)
❌ Unique codes (public identifiers)
❌ Online/offline status (visible to contacts)
❌ Contact list (stored on server)

### Best Practices
1. **Save your credentials** - You can't recover them if lost
2. **Use strong usernames** - Avoid personally identifiable information
3. **Share codes securely** - Use a secure channel to exchange codes
4. **Logout when done** - Especially on shared devices
5. **Use HTTPS** - Essential for production deployment

## 🛠️ Installation & Development

### Requirements
- Node.js 14+ (for server)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd cmfpu-chat-messenger-for-private-use

# Install dependencies
npm install

# Start the server
npm start
```

### Development

The server runs on port 8000 by default. You can change it with the PORT environment variable:

```bash
PORT=3000 npm start
```

### File Structure

```
.
├── index.html          # Frontend application
├── server.js           # Backend WebSocket server
├── package.json        # Node.js dependencies
├── .gitignore         # Git exclusions
└── README.md          # This file
```

## 📋 API Documentation (WebSocket Events)

### Client → Server

- `register` - Create new account with username
- `login` - Login with unique code and password
- `add_contact` - Add contact by unique code
- `get_contacts` - Retrieve contact list
- `send_message` - Send encrypted message
- `get_conversation` - Load conversation history

### Server → Client

- `new_message` - Receive real-time message
- `new_contact` - Notified when added as contact
- `contact_status` - Contact online/offline status change

## 🚧 Production Considerations

This is a demonstration application. For production use, consider:

### Database Integration
Replace in-memory storage with a database:
- PostgreSQL for user data and contacts
- MongoDB for message storage
- Redis for session management

### Enhanced Security
- Implement JWT authentication tokens
- Add rate limiting (prevent spam)
- Hash passwords with bcrypt
- Add CSRF protection
- Implement message expiration
- Add user blocking/reporting

### Scalability
- Use Redis for WebSocket scaling
- Implement message queuing
- Add CDN for static assets
- Use load balancers
- Implement database sharding

### Features to Add
- Group chats
- File sharing (encrypted)
- Message deletion
- Read receipts
- Typing indicators
- User profiles
- Password reset mechanism
- Two-factor authentication

## 🐛 Troubleshooting

### Can't connect to server
- Check if server is running (`npm start`)
- Verify correct port (default: 8000)
- Check firewall settings

### Messages not sending
- Check WebSocket connection (console.log)
- Verify both users are logged in
- Check server logs for errors

### Can't decrypt messages
- Ensure you're using correct credentials
- Verify encryption key derivation
- Check browser console for errors

### Lost credentials
- Unfortunately, credentials cannot be recovered
- You'll need to create a new account
- This is by design for maximum privacy

## 📄 License

MIT License - Feel free to use, modify, and distribute

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Database integration
- Enhanced security features
- UI/UX improvements
- Mobile app version
- Additional encryption methods
- Better error handling

## 📞 Support

For issues, questions, or suggestions:
- Create an issue in the repository
- Check existing issues for solutions
- Read the documentation carefully

---

**Remember**: Your privacy is paramount. This app is designed with privacy-first principles. Always use secure connections (HTTPS) and save your credentials safely!
