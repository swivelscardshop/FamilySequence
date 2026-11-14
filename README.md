# 私人連珠棋 / Private Sequence Table

手機友善、繁體中文介面及遊戲說明，撲克牌保留 A、2–10、J、Q、K 及原有花色。
一個網址、一張共用遊戲桌；不用房間代碼。最多四位玩家，藍隊與綠隊各兩人。
加入時可選擇藍隊或綠隊，各隊最多兩位；系統會自動安排兩隊交替出牌。第一位玩家是房主。

## Deploy to your Render account (English)

This ZIP is ready to run. Its prebuilt frontend and game engine are included; production needs Node.js 22+ and no npm installation.

1. Extract this ZIP. Create a **private GitHub repository** and upload the contents of the `sequence-private` folder to the repository root. Include `public`, `source`, `server.mjs`, `game.mjs`, `package.json`, and `render.yaml`. Do not upload `.env` or `data`.
2. In Render, choose **New → Blueprint**, connect that repository, and use its `render.yaml`.
3. No password or login variables are required. Deploy the Blueprint.
4. The included Blueprint selects a **paid Starter web service** without a disk. Review Render’s current charges before creating it. Games are kept only in memory and reset on server restart or deployment.
5. Open the HTTPS URL Render assigns. The game opens directly, with no login prompt.
6. Each person opens that same URL on their own device/browser, enters their name, chooses Blue (藍隊) or Green (綠隊), and presses **加入遊戲**. After four players join, the host presses **發牌開始**.

### If creating a Web Service manually

| Render field | Value |
|---|---|
| Service type | Web Service (not Static Site or Private Service) |
| Runtime | Node |
| Build command | `node --check server.mjs` |
| Start command | `npm start` |
| Node version environment variable | `NODE_VERSION=22.16.0` |
| Health check | `/healthz` |

Use one service instance. Every player only needs the HTTPS URL. A Render Web Service has an internet-reachable URL; anyone with the URL can open the game and take an available seat. Render's **Private Service** type is for internal service networking and is not the right type for friends opening a website.

No disk or DATA_DIR is needed. Old table.json files and existing DATA_DIR settings are ignored. An existing Render disk is no longer used; you can remove it in your dashboard if desired.

No room code, username, or password is needed. Player seat tokens still keep hands private and enforce turns. If upgrading an existing Render deployment, replace the files and redeploy; an old `GAME_PASSWORD` environment variable is ignored and can be removed.

## Render 部署步驟（繁體中文）

1. 解壓縮，將 `sequence-private` 資料夾內的檔案上傳至你自己的私人 GitHub 儲存庫根目錄。
2. 在 Render 選擇 **New → Blueprint**，連接該儲存庫。
3. 不需要設定密碼或帳號，直接部署。
4. 此設定會建立付費 Starter 網頁服務，不需要磁碟；建立前請確認費用。
5. 開啟 Render 提供的 HTTPS 網址即可直接進入遊戲，無需登入。
6. 每位玩家用自己的裝置輸入名字並加入；四人到齊後，房主按「發牌開始」。

## 新版外觀與全螢幕

開啟網址會先看到遊戲首頁，點「開始遊戲」後輸入名字並選隊。支援的瀏覽器會嘗試進入真正全螢幕；也可使用右上角 ⛶ 按鈕。iPhone Safari 若未支援全螢幕 API，仍使用滿版響應式介面；可透過「分享 → 加入主畫面」以網頁 App 模式開啟。介面支援直向與橫向，卡牌內容保持不變。

## 中文語音提醒

自己的回合開始時會播放「輪到你了，請出牌」，如果尚未出牌，每 20 秒再提醒一次。出牌、離開、暫停遊戲或靜音後會停止；整理手牌或更換死牌仍是同一回合。右上角 🔊／🔇 可開關聲音。「測試語音」／「重播回合提醒」可直接測試；語音未啟動時會顯示「點此恢復語音」。回到遊戲時會喚醒朗讀引擎。手機必須開啟媒體音量並有中文語音；鎖定或放到背景時，瀏覽器可能無法播放，請保持遊戲在前景。無法在此測試實際 iPhone 的聲音播放。

## J 牌辨識

J♣、J♦ 顯示兩隻眼睛、金色底與「雙眼 J／任意放置」；J♥、J♠ 顯示一隻眼睛、粉紅底與「單眼 J／移除對方」。遊戲開始後隱藏 0/2 比分列，連線與勝負仍會照常計算。

## 棋盤優先手機版面

棋盤使用接近整個螢幕寬度，牌面字體加大。底部玩家縮成一排，比分縮成小橫條。「離開遊戲」與「清空遊戲桌」移至「桌面選單」。小螢幕可上下捲動，不壓縮棋盤來塞入整頁。

## 自由整理手牌

用手指或滑鼠拖曳手牌到想要的位置。等候別人出牌時也能排序；點一下仍是選牌。鍵盤使用 Alt + 左右方向鍵移動目前聚焦的牌。排序只改變自己的手牌順序，不消耗回合，也不影響棋盤；順序會在本局中保留，結束後不另存棋局。

## 手機操作

棋盤會隨手機寬度縮放。先點選手牌，再點發光格子。遊戲與說明使用繁體中文，牌面不翻譯。橫向模式可放大格子。

## 開始新遊戲 / Start a new game

首頁、加入畫面與「桌面選單」都有「開始新遊戲」。確認後清除棋盤、手牌與全部座位，所有人重新選隊加入。即使舊座位已滿，未入座的玩家仍可使用此按鈕。

Game state is not saved to disk or browser storage. Refreshing an active tab preserves its seat via sessionStorage, but closed sessions are released by the disconnect timeout. Everyone leaving, server restart, deployment, or Start a new game clears the table. Closing one player's browser does not erase other players' active game. Responses use Cache-Control: no-store. Browser storage holds only the current tab's identity and the sound preference, never board or hand data.

## Disconnecting, leaving, and returning

Use **離開遊戲** to leave immediately. Closing the browser normally releases the seat after a 10-second grace period; refreshing within this window keeps your seat. If the browser cannot notify the server (for example, a force-closed phone app), missing heartbeats release the seat after approximately 60 seconds. A suspended phone tab may also time out.

During a game, an empty seat pauses moves. A replacement player selects the same team and takes that seat and hand; the board is preserved. Once all four seats are filled, play resumes. The host transfers automatically when the current host leaves. If everyone leaves, the table resets. Host reset remains available with confirmation.

The game implements matching placements, two-eyed wild jacks (clubs/diamonds), one-eyed removal jacks (hearts/spades), dead-card exchange once per turn, protected sequences, free corners, and two sequences to win with at most one shared space. Replacements and sequence detection are automatic; physical-table forgotten-draw penalties and verbal coaching penalties are not automated.

## Local use on Windows

Install Node.js 22 or later, then double-click `start-windows.bat`. Open `http://localhost:3000`. Use HTTPS when hosting online; Render supplies it for its assigned URL.

## Editing the source

The app is already built. To edit and rebuild: `npm install`, edit `source/`, then `npm run build`. Run `npm test` to verify the backend. No ChatGPT account, OpenAI API key, Sites hosting, Cloudflare account, or database service is required.

## Files

- `server.mjs`: Node HTTP server, direct access, seat limit, in-memory state (no saved boards or seats).
- `game.mjs`: compiled game rules.
- `public/`: production browser files.
- `source/`: editable React/TypeScript source.
- `render.yaml`: Render deployment configuration.
- `test.mjs`: integration checks.

Independent fan implementation. Not affiliated with or endorsed by JAX or Goliath. This package does not include official logos or card illustrations.

Render references: https://render.com/docs/web-services · https://render.com/docs/disks · https://render.com/docs/blueprint-spec
