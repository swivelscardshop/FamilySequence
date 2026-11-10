const BOARD = `X 2S 3S 4S 5S 6S 7S 8S 9S X
6C 5C 4C 3C 2C AH KH QH 10H 10S
7C AS 2D 3D 4D 5D 6D 7D 9H QS
8C KS 6C 5C 4C 3C 2C 8D 8H KS
9C QS 7C 6H 5H 4H AH 9D 7H AS
10C 10S 8C 7H 2H 3H KH 10D 6H 2D
QC 9S 9C 8H 9H 10H QH QD 5H 3D
KC 8S 10C QC KC AC AD KD 4H 4D
AC 7S 6S 5S 4S 3S 2S 2H 3H 5D
X AD KD QD 10D 9D 8D 7D 6D X`.split(/\s+/);
const team = (s) => s % 2 ? "green" : "blue";
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    let j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function deal(g) {
  g.deck = shuffle(Array.from({ length: 2 }, () => ["S", "H", "D", "C"].flatMap((s) => ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"].map((r) => r + s))).flat());
  g.discard = [];
  g.hands = g.players.map(() => g.deck.splice(0, 6));
  g.chips = Array(100).fill(null);
  g.lines = { blue: [], green: [] };
  g.turn = crypto.getRandomValues(new Uint32Array(1))[0] % 4;
  g.phase = "playing";
  g.exchanged = false;
  g.log = ["\u5DF2\u767C\u724C\uFF0C\u904A\u6232\u958B\u59CB\uFF01"];
  g.winner = null;
}
function draw(g) {
  if (!g.deck.length) {
    g.deck = shuffle(g.discard.splice(0));
  }
  return g.deck.pop();
}
function legal(g, seat, card, i) {
  if (BOARD[i] === "X" || i < 0 || i > 99) return false;
  if (card === "JH" || card === "JS") return g.chips[i] && g.chips[i] !== team(seat) && !Object.values(g.lines).flat(2).includes(i);
  return !g.chips[i] && (["JC", "JD"].includes(card) || BOARD[i] === card);
}
function sequences(g, color) {
  const old = g.lines[color];
  for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
    const cells = Array.from({ length: 5 }, (_, k) => [r + dr * k, c + dc * k]);
    if (cells.some(([y, x]) => y < 0 || x < 0 || y > 9 || x > 9)) continue;
    const line = cells.map(([y, x]) => y * 10 + x);
    if (line.every((i) => BOARD[i] === "X" || g.chips[i] === color) && old.every((l) => l.filter((i) => line.includes(i)).length <= 1)) {
      old.push(line);
      if (old.length === 2) return;
    }
  }
}
function action(g, token, b) {
  let s = g.players.findIndex((p) => p.token === token);
  if (s < 0) throw Error("\u8ACB\u5148\u52A0\u5165\u904A\u6232\u3002");
  if (b.action === "start" || b.action === "rematch") {
    if (s !== 0) throw Error("\u53EA\u6709\u623F\u4E3B\u53EF\u4EE5\u767C\u724C\u3002");
    if (g.players.length !== 4) throw Error("\u9700\u8981\u56DB\u4F4D\u73A9\u5BB6\u5165\u5EA7\u3002");
    if (b.action === "rematch" && g.phase !== "finished") throw Error("\u8ACB\u5148\u5B8C\u6210\u672C\u5C40\u3002");
    if (b.action === "start" && g.phase !== "lobby") throw Error("\u904A\u6232\u5DF2\u7D93\u958B\u59CB\u3002");
    deal(g);
    return;
  }
  if (g.phase !== "playing" || s !== g.turn) throw Error("\u8ACB\u7B49\u5F85\u4F60\u7684\u56DE\u5408\u3002");
  const card = g.hands[s][b.card];
  if (!card) throw Error("\u8ACB\u5148\u9078\u64C7\u4E00\u5F35\u624B\u724C\u3002");
  if (b.action === "exchange") {
    if (card[0] === "J" || BOARD.some((v, i) => v === card && !g.chips[i])) throw Error("\u9019\u5F35\u724C\u4E0D\u662F\u6B7B\u724C\u3002");
    if (g.exchanged) throw Error("\u6BCF\u56DE\u5408\u53EA\u80FD\u66F4\u63DB\u4E00\u5F35\u6B7B\u724C\u3002");
    g.discard.push(card);
    g.hands[s].splice(b.card, 1, draw(g));
    g.exchanged = true;
    g.log.unshift(g.players[s].name + " \u66F4\u63DB\u4E86\u4E00\u5F35\u6B7B\u724C\u3002");
    return;
  }
  if (b.action !== "play" || !legal(g, s, card, b.cell)) throw Error("\u8ACB\u9078\u64C7\u767C\u5149\u7684\u683C\u5B50\u3002");
  g.chips[b.cell] = ["JH", "JS"].includes(card) ? null : team(s);
  g.discard.push(card);
  g.hands[s].splice(b.card, 1);
  const next = draw(g);
  if (next) g.hands[s].push(next);
  sequences(g, team(s));
  g.log.unshift(g.players[s].name + " \u6253\u51FA\u4E86 " + card + ".");
  g.log = g.log.slice(0, 12);
  if (g.lines[team(s)].length >= 2) {
    g.winner = team(s);
    g.phase = "finished";
  } else if (g.chips.every((v, i) => v || BOARD[i] === "X")) {
    g.phase = "finished";
    g.winner = "draw";
  } else g.turn = (g.turn + 1) % 4;
  g.exchanged = false;
}
function view(g, token) {
  const seat = g.players.findIndex((p) => p.token === token);
  return { ...g, players: g.players.map((p) => ({ name: p.name })), deck: g.deck?.length || 0, hands: void 0, hand: g.hands?.[seat] || [], seat, discard: g.discard?.slice(-1) || [] };
}
export {
  BOARD,
  action,
  deal,
  draw,
  legal,
  sequences,
  shuffle,
  team,
  view
};
