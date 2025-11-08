# 🔒 Private Secure Chat Messenger

A privacy-focused, browser-based chat application with multiple layers of password protection and end-to-end encryption.

## 🛡️ Privacy Features

- **Master Password Protection**: Access to the application requires a master password
- **Unique User Passwords**: Each user must have their own unique password (minimum 12 characters)
- **No Password Storage**: Passwords are NEVER stored - you must enter them every time you access the chat
- **End-to-End Encryption**: All messages are encrypted using AES-256-GCM encryption
- **Derived Encryption Keys**: User passwords are used to derive encryption keys via PBKDF2
- **Session-Only Memory**: Sensitive data is cleared when you close the browser
- **Zero Persistence**: No sensitive data survives browser closure

## 🔐 Security Architecture

### Layer 1: Master Password
- Required to access the application
- Minimum 8 characters
- Hashed using SHA-256
- Set on first use, required for all subsequent access

### Layer 2: User Authentication
- Unique username for each user
- Unique password (minimum 12 characters recommended)
- Password strength indicator
- Never stored anywhere - must be remembered

### Layer 3: Message Encryption
- All messages encrypted with AES-256-GCM
- Encryption key derived from user password using PBKDF2 (100,000 iterations)
- Each message has unique initialization vector (IV)
- Messages can only be decrypted with correct user password

## 🚀 How to Use

### First Time Setup

1. **Open the Application**
   - Open `index.html` in your web browser
   - Or use the simple server (see below)

2. **Set Master Password**
   - Enter a master password (minimum 8 characters)
   - Remember this password - it's required to access the app
   - Click "Access Application"

3. **Create Your User Account**
   - Enter a username (minimum 3 characters)
   - Enter a unique password (minimum 12 characters for security)
   - Use the password strength indicator to ensure strong password
   - Click "Enter Chat"

4. **Start Chatting**
   - All messages are automatically encrypted
   - Messages are decrypted only when you have the correct password
   - Multiple users can chat if they share the same browser localStorage

### Every Time You Use the App

1. Enter the master password
2. Enter your username and unique password
3. Your previous messages will be decrypted and displayed
4. Other users' messages will show as encrypted if you don't have their password

## 💻 Running the Application

### Option 1: Direct File Access
Simply open `index.html` in any modern web browser.

### Option 2: Using Python HTTP Server
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```
Then open `http://localhost:8000` in your browser.

### Option 3: Using Node.js HTTP Server
```bash
npm install
npm start
```
Then open `http://localhost:8000` in your browser.

## ⚠️ Important Security Notes

1. **Remember Your Passwords**: Passwords are never stored. If you forget them, you cannot decrypt your messages.

2. **Browser Storage**: This demo uses localStorage for message storage. For production use, implement a proper backend server.

3. **Shared Device**: Each browser on each device has separate storage. Messages are not synced across devices in this demo.

4. **Password Strength**: Use strong, unique passwords:
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, and symbols
   - Don't reuse passwords from other services

5. **Privacy Best Practices**:
   - Always logout when finished
   - Don't use on shared/public computers
   - Close browser to clear session data
   - Clear browser cache for maximum privacy

## 🔧 Technical Details

### Encryption Specifications
- **Algorithm**: AES-256-GCM
- **Key Derivation**: PBKDF2 with SHA-256
- **Iterations**: 100,000
- **IV Length**: 12 bytes (96 bits)
- **Password Hashing**: SHA-256

### Browser Requirements
- Modern browser with Web Crypto API support
- JavaScript enabled
- localStorage enabled
- Recommended: Chrome, Firefox, Safari, Edge (latest versions)

### File Structure
```
.
├── index.html          # Main application (self-contained)
├── package.json        # Node.js dependencies (optional)
├── server.js           # Simple HTTP server (optional)
└── README.md          # This file
```

## 🎯 Use Cases

- Private conversations requiring maximum security
- Temporary secure communication
- Learning about web cryptography
- Privacy-focused messaging
- Secure note-taking with encryption

## 📋 Limitations

This is a demonstration/proof-of-concept application with the following limitations:

1. **Local Storage Only**: Messages stored in browser localStorage (single device)
2. **No Real-Time Sync**: Messages update via polling, not real-time WebSocket
3. **Single Browser**: Different browsers/devices have separate storage
4. **No User Management**: No backend for true multi-user authentication
5. **Demo Purpose**: Not intended for production use without backend implementation

## 🔄 Future Enhancements (For Production)

- Backend server with real-time WebSocket connections
- Proper user registration and authentication
- Database for encrypted message storage
- Cross-device synchronization
- Group chat support
- File sharing with encryption
- Message deletion and expiration
- Two-factor authentication
- Recovery mechanisms (while maintaining privacy)

## 📄 License

This is a privacy-focused demonstration project. Use at your own risk.

## 🤝 Contributing

This is a private chat messenger focused on maximum privacy. Contributions welcome for:
- Enhanced security features
- Better encryption methods
- UI/UX improvements
- Backend implementation
- Mobile responsiveness

---

**Remember**: Your privacy is only as strong as your password. Use strong, unique passwords and never share them with anyone.
