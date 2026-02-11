const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./exam.db');

console.log('=== 更新考试名称，添加时间戳 ===\n');

// 获取所有考试
db.all(`SELECT id, title, created_at FROM exams WHERE title = '高一数学综合测试卷'`, [], (err, rows) => {
    if (err) {
        console.error('查询失败:', err);
        db.close();
        return;
    }

    console.log(`找到 ${rows.length} 个同名考试:\n`);

    if (rows.length === 0) {
        console.log('没有需要更新的考试');
        db.close();
        return;
    }

    // 为每个考试添加不同的时间戳
    rows.forEach((exam, index) => {
        const date = new Date(exam.created_at || Date.now());
        // 给每个考试不同的时间（间隔1分钟）
        date.setMinutes(date.getMinutes() + index);

        const timestamp = `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        const newTitle = `高一数学综合测试卷 (${timestamp})`;

        db.run(`UPDATE exams SET title = ? WHERE id = ?`, [newTitle, exam.id], (err) => {
            if (err) {
                console.error(`更新考试 ${exam.id} 失败:`, err.message);
            } else {
                console.log(`✅ ${exam.id.substring(0, 8)}... -> ${newTitle}`);
            }

            // 最后一个更新完成后关闭数据库
            if (index === rows.length - 1) {
                console.log('\n=== 更新完成 ===');
                db.close();
            }
        });
    });
});
