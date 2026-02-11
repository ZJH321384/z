const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./exam.db');

console.log('=== 检查教师班级数据 ===\n');

db.all(`SELECT id, username, name, classes FROM teachers`, [], (err, rows) => {
    if (err) {
        console.error('查询失败:', err);
        db.close();
        return;
    }

    console.log(`找到 ${rows.length} 位教师:\n`);
    
    rows.forEach(teacher => {
        console.log(`教师: ${teacher.name} (${teacher.username})`);
        console.log(`班级: ${teacher.classes}`);
        console.log('');
    });

    db.close();
});
