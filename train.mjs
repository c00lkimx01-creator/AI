// 使い方: node train.mjs [corpus.txt]
// 出力: src/model.json（Workerがこれを読み込む）
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ORDER = Number(process.env.ORDER ?? 4);
const here = dirname(fileURLToPath(import.meta.url));
const input = process.argv[2] ?? join(here, "corpus.txt");
const output = join(here, "src", "model.json");

const text = readFileSync(input, "utf8").replace(/\r/g, "");

// table[文脈] = { 次の文字: 出現回数 }
const table = {};
for (let n = 1; n <= ORDER; n++) {
  for (let i = n; i < text.length; i++) {
    const ctx = text.slice(i - n, i);
    const ch = text[i];
    const row = (table[ctx] ??= {});
    row[ch] = (row[ch] ?? 0) + 1;
  }
}

writeFileSync(output, JSON.stringify({ order: ORDER, table }));
console.log(`完了: 文脈数 ${Object.keys(table).length} -> ${output}`);
