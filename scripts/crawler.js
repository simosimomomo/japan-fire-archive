const fs = require('fs');
const path = require('path');

// 取得先のリソース一覧（NHK、Googleニュース、林野庁、消防庁などのRSS/XML）
const RSS_URLS = {
  nhk: 'https://www.nhk.or.jp/rss/news/cat0.xml',
  google_news: 'https://news.google.com/rss/search?q=' + encodeURIComponent('森林火災 OR 神社 火災 OR 寺 火災 when:1d') + '&hl=ja&gl=JP&ceid=JP:ja',
  fdma: 'https://www.fdma.go.jp/mission/disaster/infomation/index.xml', // 消防庁災害情報一覧を模したフィード
  rinya: 'https://www.rinya.maff.go.jp/j/press/index.xml' // 林野庁プレスリリースを模したフィード
};

// 抽出したいキーワードの定義
const KEYWORDS = ['森林火災', '山火事', '神社', '寺', '寺院', '仏閣', '火災', '出火'];
const EXCLUDE_KEYWORDS = ['ボランティア', '訓練', '予防'];

// 簡易的な地域名から緯度経度を割り出す辞書（※本番ではより詳細なジオコーディングに拡張可能）
const LOCATION_DICT = {
  '東京': { lat: 35.6895, lng: 139.6917 },
  '京都': { lat: 35.0116, lng: 135.7681 },
  '奈良': { lat: 34.6851, lng: 135.8048 },
  '千葉': { lat: 35.6074, lng: 140.1063 },
  '鴨川': { lat: 35.1079, lng: 140.1021 },
  // 必要に応じて自動で位置を特定する仕組みを拡張します
};

async function fetchFireData() {
  console.log("火災情報の自動取得を開始します...");
  
  // 保存先ファイルのパス設定（GitHub Pagesの地図が読み込むファイル）
  const dataFilePath = path.join(__dirname, 'data.json');
  
  // 既存のデータを読み込む（過去の履歴を保存し続けるため）
  let currentData = [];
  if (fs.existsSync(dataFilePath)) {
    try {
      currentData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    } catch (e) {
      console.log("既存データの読み込みに失敗したため、新規作成します。");
    }
  }

  // 今回取得したデータを一時保存する配列
  let newEntries = [];

  // 本来はここで各URLにアクセスして解析（Fetch & Parse）を行います
  // 初心者向けに、エラーで止まらない安定したベースロジックを記述しています
  for (const [source, url] of Object.entries(RSS_URLS)) {
    console.log(`${source} からデータをチェック中...`);
    
    // サンプルとして、ニュースがヒットしたと仮定したデモデータを生成
    // （※実際のRSS読み込みモジュール『rss-parser』等を導入すると完全自動化されます）
    if (Math.random() > 0.3) { 
      const mockTitle = `${source === 'nhk' || source === 'google_news' ? '京都の歴史ある神社で火災発生' : '森林火災に関する注意喚起と被害状況について'}`;
      
      // キーワードチェック
      const hasKeyword = KEYWORDS.some(kw => mockTitle.includes(kw));
      const hasExclude = EXCLUDE_KEYWORDS.some(kw => mockTitle.includes(kw));

      if (hasKeyword && !hasExclude) {
        // 位置情報の判定（簡易版）
        let lat = 36.2048; // 日本の中心付近をデフォルト値に
        let lng = 138.2529;
        let type = mockTitle.includes('森林') || mockTitle.includes('山火事') ? 'forest' : 'temple';

        for (const [key, geo] of Object.entries(LOCATION_DICT)) {
          if (mockTitle.includes(key)) {
            lat = geo.lat;
            lng = geo.lng;
            break;
          }
        }

        newEntries.push({
          id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: mockTitle,
          source: source.toUpperCase(),
          url: url,
          date: new Date().toISOString().split('T')[0],
          lat: lat,
          lng: lng,
          type: type // 'forest' (森林火災) または 'temple' (神社仏閣火災)
        });
      }
    }
  }

  // 過去のデータと新しいデータを結合（重複はIDで排除）
  const combinedData = [...newEntries, ...currentData];
  const uniqueData = Array.from(new Map(combinedData.map(item => [item.title + item.date, item])).values());

  // データを保存
  fs.writeFileSync(dataFilePath, JSON.stringify(uniqueData, null, 2), 'utf8');
  console.log(`更新完了：新しく ${newEntries.length} 件のデータを追加しました。総データ数: ${uniqueData.length} 件`);
}

fetchFireData().catch(err => {
  console.error("エラーが発生しました:", err);
  process.exit(1);
});
