import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

void main() => runApp(GameScreen());

class GameScreen extends StatefulWidget {
  @override
  _GameScreenState createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  late WebSocketChannel channel;
  String lastInput = '';

  @override
  void initState() {
    super.initState();
    channel = WebSocketChannel.connect(Uri.parse('ws://localhost:8080'));
    // ゲーム画面として登録
    channel.sink.add(jsonEncode({'type': 'register', 'role': 'game'}));
    channel.stream.listen((message) {
      final msg = jsonDecode(message);
      if (msg['type'] == 'input') {
        setState(() {
          lastInput = msg['data'].toString();
        });
        // 必要ならコントローラーに応答を返す
        // channel.sink.add(jsonEncode({'type': 'game_update', 'data': '受信: ${msg['data']}'}));
      }
    });
  }

  @override
  void dispose() {
    channel.sink.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: Text('ゲーム画面')),
        body: Center(
          child: Text('最後の入力: $lastInput', style: TextStyle(fontSize: 24)),
        ),
      ),
    );
  }
}
