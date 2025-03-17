const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { parser } = require('./mecanum_api');

const app = express();
const PORT = process.env.PORT || 5001;
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = new Set();

wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    clients.add(ws);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received:', data);
            // parser(data)
            clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                }
            });
            
        } catch (error) {
            console.error('Invalid JSON received:', message);
            ws.send(JSON.stringify({ error: 'Invalid JSON format' }));
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
        clients.delete(ws);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
