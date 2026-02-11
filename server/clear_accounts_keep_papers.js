const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./exam.db');

console.log('=== 清空账户数据，保留试卷库 ===\n');

// 获取当前统计
db.get("SELECT COUNT(*) as count FROM papers", [], (err, row) => {
    if (err) {
        console.error('查询试卷库失败:', err);
    } else {
        console.log(`📚 试卷库中有 ${row.count} 套试卷`);
    }
});

db.get("SELECT COUNT(*) as count FROM teachers", [], (err, row) => {
    if (err) {
        console.error('查询教师账户失败:', err);
    } else {
        console.log(`👨‍🏫 教师账户有 ${row.count} 个`);
    }
});

db.get("SELECT COUNT(*) as count FROM exams", [], (err, row) => {
    if (err) {
        console.error('查询考试失败:', err);
    } else {
        console.log(`📝 考试有 ${row.count} 场`);
    }
    console.log('');

    // 开始清理
    console.log('开始清理数据...\n');

    // 1. 清空教师表（账户数据）
    db.run("DELETE FROM teachers", [], function(err) {
        if (err) {
            console.error('❌ 清空教师表失败:', err.message);
        } else {
            console.log(`✅ 已清空教师表 (${this.changes} 条记录)`);
        }

        // 2. 清空考试表
        db.run("DELETE FROM exams", [], function(err) {
            if (err) {
                console.error('❌ 清空考试表失败:', err.message);
            } else {
                console.log(`✅ 已清空考试表 (${this.changes} 条记录)`);
            }

            // 3. 清空题目表
            db.run("DELETE FROM questions", [], function(err) {
                if (err) {
                    console.error('❌ 清空题目表失败:', err.message);
                } else {
                    console.log(`✅ 已清空题目表 (${this.changes} 条记录)`);
                }

                // 4. 清空学生答案表
                db.run("DELETE FROM student_answers", [], function(err) {
                    if (err) {
                        console.error('❌ 清空学生答案表失败:', err.message);
                    } else {
                        console.log(`✅ 已清空学生答案表 (${this.changes} 条记录)`);
                    }

                    // 5. 清空教师任务表
                    db.run("DELETE FROM teacher_tasks", [], function(err) {
                        if (err) {
                            console.error('❌ 清空教师任务表失败:', err.message);
                        } else {
                            console.log(`✅ 已清空教师任务表 (${this.changes} 条记录)`);
                        }

                        // 验证试卷库是否保留
                        db.get("SELECT COUNT(*) as count FROM papers", [], (err, row) => {
                            if (err) {
                                console.error('查询试卷库失败:', err);
                            } else {
                                console.log(`\n📚 试卷库保留: ${row.count} 套试卷`);
                            }

                            console.log('\n=== 清理完成 ===');
                            console.log('✅ 账户数据已清空');
                            console.log('✅ 试卷库已保留');
                            console.log('\n请重启服务器以应用新的数据库结构');

                            db.close();
                        });
                    });
                });
            });
        });
    });
});
