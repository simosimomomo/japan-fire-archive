const fs = require("fs");

const file = "./data/fire_history.json";

let data = [];

if (fs.existsSync(file)) {
    data = JSON.parse(
        fs.readFileSync(file, "utf8")
    );
}

const today = new Date()
.toISOString()
.substring(0,10);

const sample = {
    id: Date.now().toString(),
    type: "forest",
    name: "自動更新テスト",
    date: today,
    lat: 35.68,
    lng: 139.76,
    prefecture: "東京都",
    damage_area: "不明",
    summary: "GitHub Actions動作確認",
    source: "自動生成"
};

data.push(sample);

fs.writeFileSync(
    file,
    JSON.stringify(data,null,2)
);

console.log("updated");
