const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./exam.db');

console.log('=== 更新教师班级数据 ===\n');

// 获取所有教师
db.all(`SELECT id, username, name, classes FROM teachers`, [], (err, rows) => {
    if (err) {
        console.error('查询失败:', err);
        db.close();
        return;
    }

    console.log(`找到 ${rows.length} 位教师\n`);

    let updatedCount = 0;

    rows.forEach(teacher => {
        let teacherClasses = [];
        try {
            teacherClasses = JSON.parse(teacher.classes);
        } catch (e) {
            teacherClasses = teacher.classes.split(',').map(c => c.trim());
        }

        console.log(`教师: ${teacher.name}`);
        console.log(`  原班级: ${JSON.stringify(teacherClasses)}`);

        // 检查是否需要更新（旧格式如"1班"需要改为"高一1班"）
        const newClasses = teacherClasses.map(cls => {
            if (cls.startsWith('高一') || cls.startsWith('高二') || cls.startsWith('高三')) {
                return cls; // 已经是新格式
            } else {
                return '高一' + cls; // 旧格式，添加"高一"前缀
            }
        });

        console.log(`  新班级: ${JSON.stringify(newClasses)}`);

        // 更新数据库
        const newClassesStr = JSON.stringify(newClasses);
        db.run(`UPDATE teachers SET classes = ? WHERE id = ?`, [newClassesStr, teacher.id], function(err) {
            if (err) {
                console.error(`  ❌ 更新失败:`, err.message);
            } else {
                console.log(`  ✅ 更新成功`);
                updatedCount++;
            }

            // 所有更新完成后关闭数据库
            if (updatedCount >= rows.length) {
                console.log(`\n=== 完成 ===`);
                console.log(`已更新 ${updatedCount} 位教师的班级数据`);
                db.close();
            }
        });
    });

    // 如果没有教师，直接关闭
    if (rows.length === 0) {
        console.log('没有教师数据需要更新');
        db.close();
    }
});
