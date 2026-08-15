/* 問題バンクの組み立て
   使い方: node build.js
   questions.js の中身 ＋ _gen_*.js（追加分）を結合し、questions.js を書き直す。
   同じ問題（分野＋設問文が同一）は1つにまとめるので、何度実行しても増殖しない。 */
const fs = require("fs");
const path = __dirname;

function loadBank() {
  const src = fs.readFileSync(path + "/questions.js", "utf8");
  return eval(src.replace(/^[\s\S]*?BANK=/, "").replace(/;\s*$/, ""));
}
function loadGen(f) {
  return eval(fs.readFileSync(path + "/" + f, "utf8"));
}

const all = loadBank();
fs.readdirSync(path).filter(f => /^_gen_.*\.js$/.test(f)).sort().forEach(f => {
  const add = loadGen(f);
  console.log(f + ": " + add.length + "問");
  all.push(...add);
});

// 重複排除（分野＋設問文）
const seen = new Set(), bank = [];
for (const q of all) {
  const k = q.t + "|" + (q.p || "") + "|" + q.q;   // 本文(p)まで見ないと長文が誤って消える
  if (seen.has(k)) continue;
  seen.add(k); bank.push(q);
}

// 検査
const bad = bank.filter(q => !(q.c && q.t && q.q && q.e && q.s > 0 && Array.isArray(q.o) && q.o.length === 4 && q.a === 0 && new Set(q.o).size === 4));
if (bad.length) { console.error("不備のある問題が " + bad.length + " 件あります"); process.exit(1); }

const out = bank.map(q => JSON.stringify(q)).join(",\n");
// const だと window に乗らず drill.html から読めないので window に直接置く
fs.writeFileSync(path + "/questions.js", "/* SPI問題バンク（オリジナル類題）自動生成: node build.js */\nwindow.BANK=[\n" + out + "\n];\n");

// 問題数が変わったらブラウザのキャッシュを外す（drill.html の読み込みURLに版を付ける）
const drill = path + "/drill.html";
let d = fs.readFileSync(drill, "utf8");
d = d.replace(/<script src="questions\.js(\?v=\d+)?"><\/script>/, '<script src="questions.js?v=' + bank.length + '"></script>');
fs.writeFileSync(drill, d);

const by = {};
bank.forEach(q => by[q.t] = (by[q.t] || 0) + 1);
console.log("---\n合計 " + bank.length + "問（言語 " + bank.filter(q => q.c === "言語").length + " / 非言語 " + bank.filter(q => q.c === "非言語").length + "）");
console.log(by);
