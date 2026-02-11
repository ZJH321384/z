const sqlite3 = require('sqlite3').verbose();

// 连接到数据库
const dbPath = './exam.db';
console.log('数据库路径:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('无法连接到数据库:', err.message);
        return;
    }
    console.log('成功连接到数据库\n');
});

// 查询所有教师账户
db.all(`SELECT id, username, password, name, subject, created_at FROM teachers`, [], (err, rows) => {
    if (err) {
        console.error('查询失败:', err.message);
        return;
    }

    console.log('=== 教师账户列表 ===');
    console.log(`共找到 ${rows.length} 个账户\n`);

    if (rows.length === 0) {
        console.log('⚠️ 数据库中没有教师账户');
        console.log('\n默认账户信息：');
        console.log('  用户名: teacher1');
        console.log('  密码: 123456');
    } else {
        rows.forEach((row, index) => {
            console.log(`\n[账户 ${index + 1}]`);
            console.log('  ID:', row.id);
            console.log('  用户名:', row.username);
            console.log('  密码:', row.password);
            console.log('  姓名:', row.name);
            console.log('  科目:', row.subject);
            console.log('  创建时间:', row.created_at);
        });
    }

    console.log('\n========================');
});

// 关闭数据库连接
db.close((err) => {
    if (err) {
        console.error('关闭数据库失败:', err.message);
    } else {
        console.log('\n数据库连接已关闭');
    }
});
