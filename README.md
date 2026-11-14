# 私人連珠棋 / Private Sequence Table

Version **2.2.0** — restores the standard playing-card game and adds away-session reservations.

## Restored game

10×10 matching board, two standard decks (104 cards), four free corners, six cards per player. Blue/green teams, two players each, alternate turns. Five chips form a sequence; two sequences win, sharing at most one space. J♣/J♦ place anywhere empty. J♥/J♠ remove an opponent chip outside a completed sequence. One dead-card exchange per turn; automatic replacement draw. This is a personal fan implementation, not an official or licensed product. This package does not establish IP or App Store clearance.

## 切換 App 不會立即離桌

切換 App、鎖定手機或關閉網頁，座位與手牌預設保留 **15 分鐘**，同桌會顯示「暫離」並暫停出牌。用同一瀏覽器返回會恢復原本座位、手牌、棋盤與語音訊息。請勿清除瀏覽器資料或切換無痕模式。超過保留期限可能釋放座位。

「離開遊戲」會立即釋放座位。「開始新遊戲」、全員離開或伺服器重新啟動仍會清空棋局。這與背景 App 保留座位不同：沒有將舊棋盤寫入磁碟。Render 服務重新部署或重新啟動，不能保留記憶體中的對局。

Advanced: HEARTBEAT_TIMEOUT_MS and CLOSE_GRACE_MS default to 900000 (15 minutes). Explicit leaving is immediate. The browser stores only a random player identity and sound preference, never board or hand data. Reopening the same browser can use that identity to recover the server-held seat.

## Features

- Chinese UI, large numbers, board zoom and number/suit labels visible on chips.
- One-eye and two-eye J labels/illustrations. Touch/mouse/keyboard card reordering.
- Current player's name below the board turns red; paused players are not highlighted.
- Spoken Chinese turn reminders every 20 seconds while your turn remains active, with mute/recovery controls.
- Game voice/text assistant and local heuristic move suggestions (not a general language model).
- Hold-to-record player messages; release to send; tap to play. All four seated players can listen. 30-second maximum, newest 20 clips, in-memory only. Microphone/recording needs HTTPS and compatible browser support; test actual phones after deployment. First allow the microphone, then hold again if you released during the permission dialog. Voice is not sent to AI transcription; it is delivered to your game server.
- Match scorecard under table menu; champagne/confetti/dinner congratulations. Rematch keeps scores; new game resets them.
- Photos appear only on winning-team balloons. Meiye uses black-hat portrait; screenshot Chinese name variants use white-hat portrait. Other players get initials. The supplied original photo is bundled for the personal celebration; deploying makes it accessible at the game's URL. No generated UI preview image is bundled.

## Render setup

Already built. Production needs Node.js 22+, no package installation or API keys.

1. Extract and upload the contents of `sequence-private` into your private GitHub repository root.
2. Existing Render service: commit the updated files, then Manual Deploy → Deploy latest commit. Rejoin after deployment because this resets the server-held game.
3. New service: Render New → Blueprint, connect repository, review render.yaml. Default is paid Starter service without disk. Check current charges before creating. No password or room code.
4. Build: `node --check server.mjs`. Start: `npm start`. Health: `/healthz`. Node environment: NODE_VERSION=22.16.0.
5. Share HTTPS URL. Four users enter names and select teams. First player hosts and taps 發牌開始 once all have joined.

Use one server instance. Anyone with the URL can join an empty seat and use Start New Game after confirmation. Scores and voice messages are not saved to disk. Old DATA_DIR/table.json are ignored. An existing disk is not needed.

## Local and development

Windows: install Node.js 22+, double-click start-windows.bat, visit http://localhost:3000. No password needed.

To edit: npm install → edit source/ → npm run build → npm test. Version is in VERSION.txt and package.json. Production build is in public/ and game.mjs.
