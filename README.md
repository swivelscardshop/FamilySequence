# 私人連珠棋 / Private Sequence Table

手機友善、繁體中文介面及遊戲說明，撲克牌保留 A、2–10、J、Q、K 及原有花色。
一個網址、一張共用遊戲桌；不用房間代碼。最多四位玩家，藍隊與綠隊各兩人。
第 1、3 位加入者為藍隊，第 2、4 位為綠隊。第一位玩家是房主。

## Deploy to your Render account (English)

This ZIP is ready to run. Its prebuilt frontend and game engine are included; production needs Node.js 22+ and no npm installation.

1. Extract this ZIP. Create a **private GitHub repository** and upload the contents of the `sequence-private` folder to the repository root. Include `public`, `source`, `server.mjs`, `game.mjs`, `package.json`, and `render.yaml`. Do not upload `.env` or `data`.
2. In Render, choose **New → Blueprint**, connect that repository, and use its `render.yaml`.
3. No password or login variables are required. Deploy the Blueprint.
4. The included Blueprint selects a **paid Starter web service** and a **1 GB persistent disk**. Review Render's current charges before creating it. The disk preserves the table across deploys and restarts.
5. Open the HTTPS URL Render assigns. The game opens directly, with no login prompt.
6. Each person opens that same URL on their own device/browser, enters their name, and presses **加入遊戲**. After four players join, the host presses **發牌開始**.

### If creating a Web Service manually

| Render field | Value |
|---|---|
| Service type | Web Service (not Static Site or Private Service) |
| Runtime | Node |
| Build command | `node --check server.mjs` |
| Start command | `npm start` |
| Node version environment variable | `NODE_VERSION=22.16.0` |
| Game data path | `DATA_DIR=/var/data/sequence` |
| Persistent disk mount path | `/var/data` |
| Persistent disk size | 1 GB |
| Health check | `/healthz` |

Use one service instance. Every player only needs the HTTPS URL. A Render Web Service has an internet-reachable URL; anyone with the URL can open the game and take an available seat. Render's **Private Service** type is for internal service networking and is not the right type for friends opening a website.

A free service without a persistent disk can run this app using `DATA_DIR=./data`, but game and seat data can disappear on a restart or deployment. This ZIP's default Blueprint uses persistent storage instead.

No room code, username, or password is needed. Player seat tokens still keep hands private and enforce turns. If upgrading an existing Render deployment, replace the files and redeploy; an old `GAME_PASSWORD` environment variable is ignored and can be removed.

## Render 部署步驟（繁體中文）

1. 解壓縮，將 `sequence-private` 資料夾內的檔案上傳至你自己的私人 GitHub 儲存庫根目錄。
2. 在 Render 選擇 **New → Blueprint**，連接該儲存庫。
3. 不需要設定密碼或帳號，直接部署。
4. 此設定會建立付費 Starter 網頁服務與 1 GB 持久磁碟；建立前請確認費用。
5. 開啟 Render 提供的 HTTPS 網址即可直接進入遊戲，無需登入。
6. 每位玩家用自己的裝置輸入名字並加入；四人到齊後，房主按「發牌開始」。

## 手機操作

棋盤會隨手機寬度縮放。先點選手牌，再點發光格子。遊戲與說明使用繁體中文，牌面不翻譯。橫向模式可放大格子。

## Returning, new players, and resetting

Keep using the same browser/device: a local player token restores your seat after refresh. Other players' hands never leave the server. Teammates cannot see one another's cards.
The host can use **清空遊戲桌並重新入座** to clear the table, release all four seats, and start with different people. The UI asks before clearing. Changing browsers or clearing browser storage loses that device's seat token. If the host token is lost, stop the service, remove `table.json` from your data directory, then restart; this resets the whole game.

The game implements matching placements, two-eyed wild jacks (clubs/diamonds), one-eyed removal jacks (hearts/spades), dead-card exchange once per turn, protected sequences, free corners, and two sequences to win with at most one shared space. Replacements and sequence detection are automatic; physical-table forgotten-draw penalties and verbal coaching penalties are not automated.

## Local use on Windows

Install Node.js 22 or later, then double-click `start-windows.bat`. Open `http://localhost:3000`. Use HTTPS when hosting online; Render supplies it for its assigned URL.

## Editing the source

The app is already built. To edit and rebuild: `npm install`, edit `source/`, then `npm run build`. Run `npm test` to verify the backend. No ChatGPT account, OpenAI API key, Sites hosting, Cloudflare account, or database service is required.

## Files

- `server.mjs`: Node HTTP server, direct access, seat limit, saved state.
- `game.mjs`: compiled game rules.
- `public/`: production browser files.
- `source/`: editable React/TypeScript source.
- `render.yaml`: Render deployment configuration.
- `test.mjs`: integration checks.

Independent fan implementation. Not affiliated with or endorsed by JAX or Goliath. This package does not include official logos or card illustrations.

Render references: https://render.com/docs/web-services · https://render.com/docs/disks · https://render.com/docs/blueprint-spec
