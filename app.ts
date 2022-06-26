const express = require('express');
const http = require('http');

const PORT = process.env['PORT'] || 8988;

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    }
});

let connectedPeers: any[] = [];

app.use(express.static(__dirname + '/dist/'));

app.get('/*', (req: any, res: any) => {
    res.sendFile(__dirname + '/dist/index.html');
});

io.on('connect', (socket: any) => {
    connectedPeers.push(socket.id);
    console.log(`${socket.id} is connected`);
    console.log(connectedPeers);
    io.to(socket.id).emit('connected', socket.id);

    socket.on('disconnect', () => {
        console.log(`${socket.id} is disconnected`);
        connectedPeers = peersWithoutSocketId(socket.id);
        io.emit('user-disconnected', socket.id);
    });

    socket.on('webRTC-signaling', (data: any) => {
        switch (data.type) {
            case 'offer':
                console.log(`${socket.id} sent offer to ${data.socketId}`);
                break;
            case 'answer':
                console.log(`${socket.id} sent answer to ${data.socketId}`);
                break;
            default:
                break;
        }

        io.to(data.socketId).emit('webRTC-signaling', data);
    });

    socket.on('ready-to-connect', () => {
        console.log(`${socket.id} is ready to connect`);
        io.to(socket.id).emit('ready-to-connect', peersWithoutSocketId(socket.id));
    });

    socket.on('user-toggled-mic', (mic: boolean) => {
      socket.broadcast.emit('user-toggled-mic', {userId: socket.id, mic});
    });

    socket.on('user-talking', (userTalking: boolean) => {
      socket.broadcast.emit('user-talking', {userId: socket.id, userTalking});
    });

    socket.on('user-change-name', (name: string) => {
      socket.broadcast.emit('user-change-name', {userId: socket.id, name});
      console.log(`${socket.id} changed name to ${name}`);
    });

    socket.on('user-screen-sharing', (screenSharing: boolean) => {
      socket.broadcast.emit('user-screen-sharing', {userId: socket.id, screenSharing});
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const peersWithoutSocketId = (socketId: string) => connectedPeers.filter((s) => s !== socketId);
