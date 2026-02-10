const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('exam.db');

db.all('SELECT id, type, content, article, sub_questions FROM paper_questions WHERE type = "reading" LIMIT 5', (err, rows) => {
  if (err) {
    console.error('查询失败:', err);
  } else {
    console.log('找到 ' + rows.length + ' 道阅读理解题');
    rows.forEach((r, i) => {
      console.log('--- 题目 ' + (i+1) + ' ---');
      console.log('ID:', r.id);
      console.log('Type:', r.type);
      console.log('Article:', r.article ? r.article.substring(0, 50) + '...' : 'NULL');
      console.log('Sub_questions:', r.sub_questions ? r.sub_questions.substring(0, 100) + '...' : 'NULL');
    });
  }
  db.close();
});
