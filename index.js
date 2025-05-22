const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// クライアント管理用
let controller = null;
let gameScreen = null;

wss.on('connection', function connection(ws) {
  console.log('クライアントが接続しました');

  ws.on('message', function incoming(message) {
    // 最初のメッセージで役割を登録
    try {
      const msg = JSON.parse(message);
      if (msg.type === 'register') {
        if (msg.role === 'controller') {
          controller = ws;
          ws.role = 'controller';
          console.log('コントローラー登録');
        } else if (msg.role === 'game') {
          gameScreen = ws;
          ws.role = 'game';
          console.log('ゲーム画面登録');
        }
        ws.send(JSON.stringify({ type: 'register', status: 'ok', role: msg.role }));
        return;
      }
      // コントローラーからの操作をゲーム画面に転送
      if (ws.role === 'controller' && gameScreen && gameScreen.readyState === WebSocket.OPEN) {
        console.log('コントローラーからの指示:', msg.data); // 追加
        gameScreen.send(JSON.stringify({ type: 'input', data: msg.data }));
      }
      // ゲーム画面からの応答をコントローラーに転送（必要なら）
      if (ws.role === 'game' && controller && controller.readyState === WebSocket.OPEN) {
        controller.send(JSON.stringify({ type: 'game_update', data: msg.data }));
      }
    } catch (e) {
      // 旧来のテキストメッセージ対応
      ws.send('サーバーから: ' + message);
    }
  });

  ws.on('close', function() {
    if (ws === controller) controller = null;
    if (ws === gameScreen) gameScreen = null;
    console.log('クライアントが切断されました');
  });
});

console.log('WebSocketサーバーが ws://localhost:8080 で起動しました');