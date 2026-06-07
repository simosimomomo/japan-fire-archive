const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const parser = new Parser();

// 取得先のリソース一覧（リアルタイムRSS）
const RSS_URLS = {
  nhk: 'https://www.nhk.or.jp/rss/news/cat0.xml',
  google_news: 'https://news.google.com/rss/search?q=' + encodeURIComponent('森林火災 OR 山火事 OR 神社 火災 OR 寺 火災') + '&hl=ja&gl=JP&ceid=JP:ja'
};

// 抽出キーワード
const KEYWORDS = ['森林火災', '山火事', '神社', '寺', '寺院', '仏閣', '火災', '出火'];
const EXCLUDE_KEYWORDS = ['ボランティア', '訓練', '予防', '火災保険'];

// 都道府県などの簡易位置辞書
const LOCATION_DICT = {
  '東京': { lat: 35.6895, lng: 139.6917 }, '京都': { lat: 35.0116, lng: 135.7681 },
  '奈良': { lat: 34.6851, lng: 135.8048 }, '千葉': { lat: 35.6074, lng: 140.1063 },
  '神奈川': { lat: 35.4475, lng: 139.6423 }, '大阪': { lat: 34.6937, lng: 135.5023 },
  '兵庫': { lat: 34.6913, lng: 135.1830 }, '北海道': { lat: 43.0642, lng: 141.3469 }
};

async function fetchFireData() {
  console.log("リアルタイムRSSからの火災情報取得を開始します...");
  
  // 【重要】保存先を実際のファイル名「fire_history.json」に指定
  const dataFilePath = path.join(__dirname, '../data/fire_history.json');
  
  const dataDir = path.dirname(dataFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 既存の履歴データを読み込む
  let currentData = [];
  if (fs.existsSync(dataFilePath)) {
    try {
      currentData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    } catch (e) {
      console.log("既存データの解析に失敗したため新規作成します。");
    }
  }

  let newEntries = [];

  // 各ニュースサイトのRSSを巡回
  for (const [source, url] of Object.entries(RSS_URLS)) {
    try {
      console.log(`${source.toUpperCase()} から最新ニュースを受信中...`);
      const feed = await parser.parseURL(url);
      
      for (const item of feed.items) {
        const title = item.title || '';
        const content = item.content || '';
        const fullText = title + content;

        const hasKeyword = KEYWORDS.some(kw => fullText.includes(kw));
        const hasExclude = EXCLUDE_KEYWORDS.some(kw => fullText.includes(kw));

        if (hasKeyword && !hasExclude) {
          const isDuplicate = currentData.some(old => old.url === item.link);
          if (isDuplicate) continue;

          let lat = 36.2048;
          let lng = 138.2529;
          let type = title.includes('森林') || title.includes('山火事') ? 'forest' : 'temple';

          for (const [key, geo] of Object.entries(LOCATION_DICT)) {
            if (fullText.includes(key)) {
              lat = geo.lat;
              lng = geo.lng;
              break;
            }
          }

          newEntries.push({
            id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            title: title,
            source: source.toUpperCase(),
            url: item.link || '',
            date: new Date(item.pubDate || Date.now()).toISOString().split('T')[0],
            lat: lat,
            lng: lng,
            type: type
          });
        }
      }
    } catch (err) {
      console.error(`${source} のデータ取得中にエラーが発生しました:`, err);
    }
  }

  // 新しいデータと過去のデータを合体させて保存
  const combinedData = [...newEntries, ...currentData];
  fs.writeFileSync(dataFilePath, JSON.stringify(combinedData, null, 2), 'utf8');
  console.log(`更新完了！現在の総データ数: ${combinedData.length} 件`);
}

fetchFireData().catch(err => {
  console.error("重大なエラーが発生しました:", err);
  process.exit(1);
});
