# 星橋棋 / Starbridge — working title

Version **2.1.0**. Independently implemented four-player nature-tile strategy game.
**The name is provisional, not a cleared trademark. This package is not a legal opinion or a guarantee of non-infringement.**

## What changed

- New 8×8 board, independently generated arrangement, no free corners.
- Four nature families: sun ☀, moon ☾, leaf ❧, water ≈; each numbered 1–8.
- No standard playing-card faces or J abilities. Two distinct power tiles: Starbridge ⌒ and Breeze 〰.
- Four stars build a path. Three disjoint paths win. Paths cannot share a star.
- New instructions, theme and presentation, no third-party game name or logos in the UI.
- Personalized edition: winning-team balloons use the supplied photos; Meiye maps to black hat and the screenshot’s Chinese name maps to white hat. Other players use initials. The regular roster has initials, and only the active name turns red.

No claim is made that these changes settle every copyright, trademark, trade-dress, patent, photograph, font or platform question. Obtain IP review and name clearance before public/commercial distribution. Apple approval is a separate review. Do not describe this as an official adaptation of another game.

## 規則

四位玩家分成藍綠兩隊，每隊兩人。每人六張手牌。出一張自然牌，在數字與圖案相同的空格落星，然後自動補牌。星圖共有 64 格，每種自然牌出現兩次。

橫、直、斜向連成四枚同色星子，即築成星橋。星橋受到保護，不能被微風移除。先完成三座不共用星子的星橋獲勝，沒有免費角落。

星橋牌（⌒）可在任意空格落星。微風牌（〰）可移除對方尚未築橋的散星。兩個對應格子都被佔用的自然牌，每回合可換一張，然後繼續出牌。

## Features retained

Chinese UI and spoken 20-second turn reminders; large numbers and optional board zoom; touch/mouse hand reordering; game-aware move advice and Chinese voice/text assistant; team selection; shared wins scorecard; champagne/confetti/initial balloons and dinner joke. The assistant uses local heuristic analysis, not a general language model, and doesn't see other hands. Browser microphone/speech support varies; typed chat is available. Browser recognition may send audio to the browser provider's service.

No passwords or room codes. One shared table, two players per team. Anyone with the URL can join or use Start New Game after confirmation. Use one server instance. Private hands use random per-tab tokens; no player account system.

## Render setup

Already built: Node.js 22+ runs the package with no dependency installation.

1. Extract the ZIP and upload the contents of `starbridge-game` to your private GitHub repository root.
2. For a **new deployment**, choose Render **New → Blueprint**, select the repository and review `render.yaml`. It uses a paid Starter service; check current charges before creating it. No disk or API keys required.
3. For an **existing deployment**, replace the repository contents, commit, then deploy the latest commit on the existing Render service. Do not create another Blueprint unless you want a separate service. Your old URL may still contain the previous project name; change that separately in your hosting account if desired.
4. Build command: `node --check server.mjs`. Start command: `npm start`. Health check: `/healthz`. Node environment: `NODE_VERSION=22.16.0`.
5. Share the assigned HTTPS URL with three friends. Each enters a name and chooses a team. First player hosts and presses 發牌開始 once all four have joined.

## Sessions and scores

No boards, hands or scores are saved to disk. Old table.json / DATA_DIR values are ignored. Refreshing a tab preserves its seat; closing normally releases it after ~10 seconds, lost heartbeat after ~60 seconds. Empty seats pause the game and can be refilled. Everyone leaving resets it. Start New Game, deployment and server restart reset the table and scorecard. Rematch preserves win totals. Browser responses use no-store.

## Local Windows use

Install Node.js 22+, then double-click start-windows.bat. Open http://localhost:3000. No password required. Render's HTTPS URL is used for online play.

## Editing

Run `npm install`, edit `source/`, `npm run build`, and `npm test`. Production files are included. `VERSION.txt` records the release. If a dependency is changed, review its license and commit the new lockfile.

## v2.0.1 personal celebration update

In-game names below the board: active player’s name turns bright red; no glowing frame and no face photos in the roster. Winning-team balloons: Meiye uses the black-hat portrait; 姨妈/姨媽 (and the screenshot spelling variants) uses white-hat portrait automatically. The uploaded original photo is included as a game asset for these balloon portraits. No generated preview image is included. Deploying this personalized package makes that photo accessible through the game’s URL. This version is a personal-photo edition, not the photo-free public-release package.

## v2.1.0 玩家語音訊息

玩家入座後，底部顯示「玩家語音訊息」。按住錄音，放開傳送，展開列表後點訊息播放；再點正在播放的訊息可停止。所有已入座玩家都能收聽，不會自動播放，也不是隊內私訊或即時通話。每段最多 30 秒，保留最近 20 段。音訊暫存在伺服器記憶體，不寫入磁碟；開始新遊戲、全員離開或重新啟動服務時清除。重新開一局（rematch）保留同桌訊息。

首次需要允許麥克風。如果在授權時已放開按鈕，請再按住一次，避免授權後意外錄音。切到背景、離開畫面或取消操作會放棄未送出的錄音並關閉麥克風。錄音期間不播放自動回合語音。支援鍵盤：按住空白鍵或 Enter 錄音，放開傳送。

需 HTTPS 或 localhost 及支援 getUserMedia/MediaRecorder 的瀏覽器。錄音會優先轉為單聲道 16 kHz WAV 以方便跨裝置播放，失敗時使用瀏覽器原生 MP4/WebM/OGG。此環境未測試實際手機的麥克風和揚聲器，部署後請用兩台手機測試收發。沒有將玩家錄音送給 AI 或語音轉文字服務；只傳給你自己的遊戲伺服器。
