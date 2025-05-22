const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// ユーザーIDごとにコントローラー・ゲーム画面を管理
const controllers = new Map(); // userId => ws
const gameScreens = new Map(); // userId => ws

wss.on('connection', function connection(ws) {
  console.log('クライアントが接続しました');

  ws.on('message', function incoming(message) {
    // 最初のメッセージで役割を登録
    try {
      const msg = JSON.parse(message);
      if (msg.type === 'register') {
        const userId = msg.userId;
        if (!userId) {
          ws.send(JSON.stringify({ type: 'register', status: 'error', message: 'userIdが必要です' }));
          return;
        }
        ws.userId = userId;
        if (msg.role === 'controller') {
          controllers.set(userId, ws);
          ws.role = 'controller';
          console.log(`コントローラー登録: userId=${userId}`);
        } else if (msg.role === 'game') {
          gameScreens.set(userId, ws);
          ws.role = 'game';
          console.log(`ゲーム画面登録: userId=${userId}`);
        }
        ws.send(JSON.stringify({ type: 'register', status: 'ok', role: msg.role, userId }));
        return;
      }
      // コントローラーからの操作をゲーム画面に転送
      if (ws.role === 'controller' && ws.userId) {
        const gameScreen = gameScreens.get(ws.userId);
        if (gameScreen && gameScreen.readyState === WebSocket.OPEN) {
          console.log(`コントローラーからの指示(userId=${ws.userId}):`, msg.data);
          gameScreen.send(JSON.stringify({ type: 'input', data: msg.data }));
        }
      }
      // ゲーム画面からの応答をコントローラーに転送
      if (ws.role === 'game' && ws.userId) {
        const controller = controllers.get(ws.userId);
        if (controller && controller.readyState === WebSocket.OPEN) {
          controller.send(JSON.stringify({ type: 'game_update', data: msg.data }));
        }
      }
    } catch (e) {
      // 旧来のテキストメッセージ対応
      ws.send('サーバーから: ' + message);
    }
  });

  ws.on('close', function() {
    // 切断時にuserIdで管理しているMapから削除
    if (ws.role === 'controller' && ws.userId) controllers.delete(ws.userId);
    if (ws.role === 'game' && ws.userId) gameScreens.delete(ws.userId);
    console.log('クライアントが切断されました');
  });
});
