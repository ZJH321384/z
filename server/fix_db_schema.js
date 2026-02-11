const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./exam.db');

console.log('=== 修复数据库表结构 ===\n');

// 检查 teachers 表是否有 classes 列
db.all("PRAGMA table_info(teachers)", [], (err, columns) => {
    if (err) {
        console.error('查询表结构失败:', err);
        db.close();
        return;
    }

    const hasClassesColumn = columns.some(col => col.name === 'classes');
    const hasExamClassColumn = columns.some(col => col.name === 'exam_class');

    console.log('teachers 表列:', columns.map(c => c.name).join(', '));

    if (!hasClassesColumn) {
        console.log('\n⚠️ teachers 表缺少 classes 列，正在添加...');
        db.run("ALTER TABLE teachers ADD COLUMN classes TEXT", [], (err) => {
            if (err) {
                console.error('❌ 添加 classes 列失败:', err.message);
            } else {
                console.log('✅ classes 列添加成功');
            }

            checkExamsTable();
        });
    } else {
        console.log('✅ teachers 表已有 classes 列');
        checkExamsTable();
    }
});

function checkExamsTable() {
    db.all("PRAGMA table_info(exams)", [], (err, columns) => {
        if (err) {
            console.error('查询 exams 表结构失败:', err);
            db.close();
            return;
        }

        const hasExamClassColumn = columns.some(col => col.name === 'exam_class');

        console.log('\nexams 表列:', columns.map(c => c.name).join(', '));

        if (!hasExamClassColumn) {
            console.log('\n⚠️ exams 表缺少 exam_class 列，正在添加...');
            db.run("ALTER TABLE exams ADD COLUMN exam_class TEXT", [], (err) => {
                if (err) {
                    console.error('❌ 添加 exam_class 列失败:', err.message);
                } else {
                    console.log('✅ exam_class 列添加成功');
                }

                finish();
            });
        } else {
            console.log('✅ exams 表已有 exam_class 列');
            finish();
        }
    });
}

function finish() {
    console.log('\n=== 修复完成 ===');
    console.log('请刷新浏览器重试');
    db.close();
}
