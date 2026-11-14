const BOARD = Array.from({ length: 64 }, (_, i) => {
  const n = (i * 13 + 7) % 64 % 32;
  return String(n % 8 + 1) + ["S", "H", "D", "C"][Math.floor(n / 8)];
});
const team = (s, g) => g?.players?.[s]?.team || (s % 2 ? "green" : "blue");
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    let j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function deal(g) {
  g.matchScore ||= { blue: 0, green: 0 };
  g.results ||= [];
  g.deck = shuffle(Array.from({ length: 2 }, () => ["S", "H", "D", "C"].flatMap((s) => ["1", "2", "3", "4", "5", "6", "7", "8"].map((r) => r + s))).flat().concat(["BW", "BW", "BW", "BW", "GR", "GR", "GR", "GR"]));
  g.discard = [];
  g.hands = g.players.map(() => g.deck.splice(0, 6));
  g.chips = Array(64).fill(null);
  g.lines = { blue: [], green: [] };
  g.turn = crypto.getRandomValues(new Uint32Array(1))[0] % 4;
  g.turnOrder = [0, 1].flatMap((k) => ["blue", "green"].map((t) => g.players.map((p, i) => team(i, g) === t ? i : -1).filter((i) => i >= 0)[k]));
  g.roundId = crypto.randomUUID();
  g.turnSerial = 0;
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
  if (BOARD[i] === "X" || i < 0 || i > 63) return false;
  if (card === "GR") return g.chips[i] && g.chips[i] !== team(seat, g) && !Object.values(g.lines).flat(2).includes(i);
  return !g.chips[i] && (card === "BW" || BOARD[i] === card);
}
function sequences(g, color) {
  const old = g.lines[color];
  for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const cells = Array.from({ length: 4 }, (_, k) => [r + dr * k, c + dc * k]);
    if (cells.some(([y, x]) => y < 0 || x < 0 || y > 7 || x > 7)) continue;
    const line = cells.map(([y, x]) => y * 8 + x);
    if (line.every((i) => BOARD[i] === "X" || g.chips[i] === color) && old.every((l) => l.filter((i) => line.includes(i)).length === 0)) {
      old.push(line);
      if (old.length === 3) return;
    }
  }
}
function action(g, token, b) {
  let s = g.players.findIndex((p) => p.token === token);
  if (s < 0) throw Error("\u8ACB\u5148\u52A0\u5165\u904A\u6232\u3002");
  if (b.action === "reorder") {
    const hand = g.hands?.[s];
    const order = b.order;
    if (b.expectedHand && JSON.stringify(b.expectedHand) !== JSON.stringify(hand)) throw Error("\u624B\u724C\u5DF2\u66F4\u65B0\uFF0C\u8ACB\u91CD\u65B0\u62D6\u66F3\u3002");
    if (!hand || !Array.isArray(order) || order.length !== hand.length || new Set(order).size !== hand.length || order.some((i) => !Number.isInteger(i) || i < 0 || i >= hand.length)) throw Error("\u7121\u6548\u7684\u624B\u724C\u6392\u5217\u3002");
    g.hands[s] = order.map((i) => hand[i]);
    return;
  }
  if (b.action === "start" || b.action === "rematch") {
    if (token !== (g.hostToken || g.players[0]?.token)) throw Error("\u53EA\u6709\u623F\u4E3B\u53EF\u4EE5\u767C\u724C\u3002");
    if (g.players.length !== 4 || g.players.some((p) => p.vacant)) throw Error("\u9700\u8981\u56DB\u4F4D\u73A9\u5BB6\u5165\u5EA7\u3002");
    if (b.action === "rematch" && g.phase !== "finished") throw Error("\u8ACB\u5148\u5B8C\u6210\u672C\u5C40\u3002");
    if (b.action === "start" && g.phase !== "lobby") throw Error("\u904A\u6232\u5DF2\u7D93\u958B\u59CB\u3002");
    deal(g);
    return;
  }
  if (g.players.some((p) => p.vacant)) throw Error("\u6709\u73A9\u5BB6\u96E2\u7DDA\uFF0C\u8ACB\u7B49\u5F85\u88DC\u6EFF\u56DB\u4F4D\u73A9\u5BB6\u3002");
  if (g.phase !== "playing" || s !== g.turn) throw Error("\u8ACB\u7B49\u5F85\u4F60\u7684\u56DE\u5408\u3002");
  const card = g.hands[s][b.card];
  if (!card) throw Error("\u8ACB\u5148\u9078\u64C7\u4E00\u5F35\u624B\u724C\u3002");
  if (b.action === "exchange") {
    if (["BW", "GR"].includes(card) || BOARD.some((v, i) => v === card && !g.chips[i])) throw Error("\u9019\u5F35\u724C\u4E0D\u662F\u6B7B\u724C\u3002");
    if (g.exchanged) throw Error("\u6BCF\u56DE\u5408\u53EA\u80FD\u66F4\u63DB\u4E00\u5F35\u6B7B\u724C\u3002");
    g.discard.push(card);
    g.hands[s].splice(b.card, 1, draw(g));
    g.exchanged = true;
    g.log.unshift(g.players[s].name + " \u66F4\u63DB\u4E86\u4E00\u5F35\u6B7B\u724C\u3002");
    return;
  }
  if (b.action !== "play" || !legal(g, s, card, b.cell)) throw Error("\u8ACB\u9078\u64C7\u767C\u5149\u7684\u683C\u5B50\u3002");
  g.chips[b.cell] = card === "GR" ? null : team(s, g);
  g.discard.push(card);
  g.hands[s].splice(b.card, 1);
  const next = draw(g);
  if (next) g.hands[s].push(next);
  sequences(g, team(s, g));
  g.turnSerial = (g.turnSerial || 0) + 1;
  g.log.unshift(g.players[s].name + " \u6253\u51FA\u4E86 " + card + ".");
  g.log = g.log.slice(0, 12);
  if (g.lines[team(s, g)].length >= 3) {
    g.winner = team(s, g);
    g.phase = "finished";
    g.matchScore ||= { blue: 0, green: 0 };
    g.matchScore[g.winner]++;
    g.results = [{ roundId: g.roundId, winner: g.winner }, ...g.results || []].slice(0, 20);
  } else if (g.chips.every((v, i) => v || BOARD[i] === "X")) {
    g.phase = "finished";
    g.winner = "draw";
  } else g.turn = g.turnOrder[(g.turnOrder.indexOf(g.turn) + 1) % 4];
  g.exchanged = false;
}
function view(g, token) {
  const seat = g.players.findIndex((p) => p.token === token);
  return { ...g, hostToken: void 0, hostSeat: g.players.findIndex((p) => p.token === (g.hostToken || g.players[0]?.token)), paused: g.players.some((p) => p.vacant), players: g.players.map((p) => ({ name: p.name, portrait: p.portrait || "", vacant: !!p.vacant, team: team(g.players.indexOf(p), g) })), deck: g.deck?.length || 0, hands: void 0, hand: g.hands?.[seat] || [], seat, discard: g.discard?.slice(-1) || [] };
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
