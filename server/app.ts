const express = require('express');
const http = require('http');

const PORT = process.env.PORT || 8988;

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    }
});

let connectedPeers: any[] = [];

io.on('connect', (socket: any) => {
    connectedPeers.push(socket.id);
    console.log(`${socket.id} is connected`);
    console.log(connectedPeers);
    io.to(socket.id).emit('connected', socket.id);
    
    socket.on('disconnect', () => {
        console.log(`${socket.id} is disconnected`);
        connectedPeers = connectedPeers.filter((s) => s !== socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});