const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const crypto = require('crypto');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 8000;

// In-memory storage (in production, use a database)
const users = new Map(); // userCode -> {username, password, socketId, status}
const conversations = new Map(); // conversationId -> {user1Code, user2Code, messages[]}
const socketToUser = new Map(); // socketId -> userCode

// Serve static files
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Generate unique code (8 characters)
function generateUniqueCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Get or create conversation ID between two users
function getConversationId(code1, code2) {
    return [code1, code2].sort().join('-');
}

io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);

    // Register new user
    socket.on('register', (data, callback) => {
        const { username, password } = data;

        if (!username || username.trim().length < 2) {
            return callback({ success: false, error: 'Username must be at least 2 characters' });
        }

        if (!password || password.length < 6) {
            return callback({ success: false, error: 'Password must be at least 6 characters' });
        }

        let userCode;
        do {
            userCode = generateUniqueCode();
        } while (users.has(userCode));

        users.set(userCode, {
            username: username.trim(),
            password: password,
            socketId: socket.id,
            status: 'online',
            contacts: []
        });

        socketToUser.set(socket.id, userCode);

        console.log(`User registered: ${username} (${userCode})`);

        callback({
            success: true,
            userCode,
            username: username.trim()
        });
    });

    // Login existing user
    socket.on('login', (data, callback) => {
        const { userCode, password } = data;

        const user = users.get(userCode);

        if (!user) {
            return callback({ success: false, error: 'Invalid user code' });
        }

        if (user.password !== password) {
            return callback({ success: false, error: 'Invalid password' });
        }

        // Update user's socket ID and status
        user.socketId = socket.id;
        user.status = 'online';
        socketToUser.set(socket.id, userCode);

        console.log(`User logged in: ${user.username} (${userCode})`);

        // Notify contacts that user is online
        user.contacts.forEach(contactCode => {
            const contact = users.get(contactCode);
            if (contact && contact.socketId) {
                io.to(contact.socketId).emit('contact_status', {
                    userCode,
                    status: 'online'
                });
            }
        });

        callback({
            success: true,
            username: user.username,
            userCode,
            contacts: user.contacts
        });
    });

    // Add contact by unique code
    socket.on('add_contact', (data, callback) => {
        const { contactCode } = data;
        const userCode = socketToUser.get(socket.id);

        if (!userCode) {
            return callback({ success: false, error: 'You must be logged in' });
        }

        if (contactCode === userCode) {
            return callback({ success: false, error: 'Cannot add yourself as contact' });
        }

        const user = users.get(userCode);
        const contact = users.get(contactCode);

        if (!contact) {
            return callback({ success: false, error: 'User code not found' });
        }

        // Add to contacts if not already added
        if (!user.contacts.includes(contactCode)) {
            user.contacts.push(contactCode);
        }
        if (!contact.contacts.includes(userCode)) {
            contact.contacts.push(userCode);
        }

        // Notify the contact that they've been added
        if (contact.socketId) {
            io.to(contact.socketId).emit('new_contact', {
                userCode,
                username: user.username,
                status: user.status
            });
        }

        console.log(`${user.username} added ${contact.username} as contact`);

        callback({
            success: true,
            contact: {
                userCode: contactCode,
                username: contact.username,
                status: contact.status
            }
        });
    });

    // Get contact list
    socket.on('get_contacts', (callback) => {
        const userCode = socketToUser.get(socket.id);
        if (!userCode) {
            return callback({ success: false, error: 'Not logged in' });
        }

        const user = users.get(userCode);
        const contactList = user.contacts.map(code => {
            const contact = users.get(code);
            return {
                userCode: code,
                username: contact.username,
                status: contact.status
            };
        });

        callback({ success: true, contacts: contactList });
    });

    // Send message
    socket.on('send_message', (data) => {
        const { recipientCode, encryptedMessage, timestamp } = data;
        const senderCode = socketToUser.get(socket.id);

        if (!senderCode) return;

        const sender = users.get(senderCode);
        const recipient = users.get(recipientCode);

        if (!recipient) return;

        const conversationId = getConversationId(senderCode, recipientCode);

        // Store message in conversation
        if (!conversations.has(conversationId)) {
            conversations.set(conversationId, {
                user1Code: senderCode,
                user2Code: recipientCode,
                messages: []
            });
        }

        const message = {
            id: Date.now() + Math.random(),
            senderCode,
            recipientCode,
            encryptedMessage,
            timestamp
        };

        conversations.get(conversationId).messages.push(message);

        // Send to recipient if online
        if (recipient.socketId) {
            io.to(recipient.socketId).emit('new_message', {
                senderCode,
                senderUsername: sender.username,
                encryptedMessage,
                timestamp,
                messageId: message.id
            });
        }

        console.log(`Message from ${sender.username} to ${recipient.username}`);
    });

    // Get conversation history
    socket.on('get_conversation', (data, callback) => {
        const { contactCode } = data;
        const userCode = socketToUser.get(socket.id);

        if (!userCode) {
            return callback({ success: false, error: 'Not logged in' });
        }

        const conversationId = getConversationId(userCode, contactCode);
        const conversation = conversations.get(conversationId);

        if (!conversation) {
            return callback({ success: true, messages: [] });
        }

        callback({ success: true, messages: conversation.messages });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        const userCode = socketToUser.get(socket.id);

        if (userCode) {
            const user = users.get(userCode);
            if (user) {
                user.status = 'offline';
                user.socketId = null;

                // Notify contacts
                user.contacts.forEach(contactCode => {
                    const contact = users.get(contactCode);
                    if (contact && contact.socketId) {
                        io.to(contact.socketId).emit('contact_status', {
                            userCode,
                            status: 'offline'
                        });
                    }
                });

                console.log(`User disconnected: ${user.username} (${userCode})`);
            }
            socketToUser.delete(socket.id);
        }
    });
});

server.listen(PORT, () => {
    console.log('');
    console.log('===========================================');
    console.log('🔒 Private Secure Chat Server');
    console.log('===========================================');
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('');
    console.log('Features:');
    console.log('  ✓ Real-time 1-to-1 chat');
    console.log('  ✓ Auto-generated unique codes');
    console.log('  ✓ User-chosen passwords');
    console.log('  ✓ End-to-end encryption');
    console.log('  ✓ No master password required');
    console.log('');
    console.log('Press Ctrl+C to stop the server');
    console.log('===========================================');
    console.log('');
});
