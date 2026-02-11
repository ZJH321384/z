const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./exam.db');

console.log('=== 暂停所有考试 ===\n');

// 将所有进行中的考试改为已结束
db.run(`UPDATE exams SET status = 'ended' WHERE status = 'active'`, [], function(err) {
    if (err) {
        console.error('暂停考试失败:', err.message);
    } else {
        console.log(`✅ 已暂停 ${this.changes} 场进行中的考试`);
    }
    
    // 显示当前考试状态
    db.all(`SELECT id, title, status FROM exams`, [], (err, rows) => {
        if (err) {
            console.error('查询失败:', err);
        } else {
            console.log(`\n当前考试状态 (${rows.length} 场):`);
            rows.forEach(exam => {
                const statusText = exam.status === 'pending' ? '待开始' : exam.status === 'active' ? '进行中' : '已结束';
                console.log(`  - ${exam.title.substring(0, 30)}... [${statusText}]`);
            });
        }
        db.close();
        console.log('\n=== 完成 ===');
    });
});
