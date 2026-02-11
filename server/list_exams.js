const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./exam.db');

console.log('=== 当前考试列表 ===\n');

db.all(`SELECT id, title, subject, grade, status, created_at FROM exams ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) {
        console.error('查询失败:', err);
        return;
    }

    console.log(`共找到 ${rows.length} 个考试:\n`);
    
    rows.forEach((exam, index) => {
        console.log(`[${index + 1}] ${exam.title}`);
        console.log(`    ID: ${exam.id}`);
        console.log(`    科目: ${exam.subject} | 年级: ${exam.grade}`);
        console.log(`    状态: ${exam.status}`);
        console.log(`    创建时间: ${exam.created_at}`);
        console.log('');
    });
});

db.close();
