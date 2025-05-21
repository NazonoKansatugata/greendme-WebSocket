const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
  console.log('クライアントが接続しました');
  ws.on('message', function incoming(message) {
    console.log('受信:', message.toString());
    ws.send('サーバーから: ' + message);
  });
});

console.log('WebSocketサーバーが ws://localhost:8080 で起動しました');