const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./exam.db');

console.log('=== 检查考试数据 ===\n');

db.all(`SELECT id, title, subject, exam_class, status FROM exams`, [], (err, rows) => {
    if (err) {
        console.error('查询失败:', err);
        db.close();
        return;
    }

    console.log(`找到 ${rows.length} 场考试:\n`);
    
    rows.forEach((exam, index) => {
        const statusText = exam.status === 'pending' ? '待开始' : exam.status === 'active' ? '进行中' : '已结束';
        console.log(`[${index + 1}] ${exam.title}`);
        console.log(`    ID: ${exam.id.substring(0, 8)}...`);
        console.log(`    科目: ${exam.subject}`);
        console.log(`    考试班级: ${exam.exam_class || '未指定'}`);
        console.log(`    状态: ${statusText}`);
        console.log('');
    });

    db.close();
});
