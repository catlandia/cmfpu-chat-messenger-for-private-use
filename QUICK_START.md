# 🚀 Quick Start Instructions

## For Your PC as Server

### Step 1: Install Node.js
If you don't have Node.js installed:
1. Go to https://nodejs.org/
2. Download and install the LTS (Long Term Support) version
3. Restart your computer after installation

### Step 2: Install Dependencies

Open a terminal/command prompt in this folder and run:

**Windows (Command Prompt or PowerShell):**
```cmd
npm install
```

**Mac/Linux (Terminal):**
```bash
npm install
```

This will install the required packages (Express and Socket.IO).

### Step 3: Start the Server

**Windows:**
- Double-click `start.bat`
- OR open Command Prompt and run: `npm start`

**Mac/Linux:**
- Open Terminal and run: `chmod +x start.sh && ./start.sh`
- OR run: `npm start`

### Step 4: Access the Chat

Once the server is running, you'll see:
```
===========================================
🔒 Private Secure Chat Server
===========================================
Server running at http://localhost:8000/
```

**On the same PC (your server):**
- Open browser and go to: `http://localhost:8000`

**From other devices on your network:**
1. Find your PC's IP address:
   - Windows: Open Command Prompt, type `ipconfig`, look for "IPv4 Address"
   - Mac: System Preferences → Network
   - Linux: Type `ip addr` or `ifconfig`

2. On other devices, open browser and go to: `http://YOUR_IP:8000`
   - Example: `http://192.168.1.100:8000`

### Step 5: Create Account

1. Click "Create New Account"
2. Enter a username (minimum 2 characters)
3. Enter a password (minimum 6 characters)
4. Click "Create Account"
5. **SAVE YOUR UNIQUE CODE** - You'll need to share this with others
6. Click "Continue to Chat"

### Troubleshooting

**"Cannot connect to server" error:**
- Make sure the server is running (you should see the server message in the terminal)
- Check if port 8000 is available
- Try refreshing the page (F5)

**Create Account button doesn't work:**
1. Open browser Developer Tools (F12)
2. Check the Console tab for error messages
3. Look for "✅ Connected to server" message
4. If you see "❌ Connection error", the server isn't running

**Can't access from other devices:**
- Make sure your firewall allows connections on port 8000
- Ensure both devices are on the same network
- Use your actual IP address, not localhost

### Keeping the Server Running

The server will run as long as the terminal/command window is open. To stop:
- Press `Ctrl+C` in the terminal

To run the server in the background:
- **Windows**: Consider using a process manager
- **Linux/Mac**: Run `npm start &` or use `screen` or `tmux`

### Accessing from the Internet

To make the chat accessible from anywhere on the internet:

1. **Port Forwarding**: Forward port 8000 on your router to your PC's IP
2. **Find your public IP**: Visit https://whatismyip.com
3. **Share the URL**: `http://YOUR_PUBLIC_IP:8000`

**⚠️ Security Warning**: Exposing your server to the internet without proper security is risky. For production use, consider:
- Using a VPS/cloud server
- Setting up HTTPS with SSL certificate
- Implementing rate limiting
- Using a reverse proxy (nginx)

## Common Issues

### Port Already in Use
If you see "Port 8000 is already in use":
- Stop any other programs using port 8000
- Or change the port: `PORT=3000 npm start`

### Dependencies Not Installing
- Make sure you have internet connection
- Try: `npm cache clean --force` then `npm install` again

### Browser Shows Blank Page
- Check browser console (F12) for errors
- Make sure you're accessing the correct URL
- Try a different browser
