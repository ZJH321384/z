const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./exam.db');

console.log('=== 当前试卷库列表 ===\n');

db.all(`SELECT id, title, subject, grade, question_count, total_score FROM papers ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) {
        console.error('查询失败:', err);
        return;
    }

    console.log(`共找到 ${rows.length} 个试卷:\n`);
    
    rows.forEach((paper, index) => {
        console.log(`[${index + 1}] ${paper.title}`);
        console.log(`    ID: ${paper.id}`);
        console.log(`    科目: ${paper.subject} | 年级: ${paper.grade}`);
        console.log(`    题目数: ${paper.question_count} | 总分: ${paper.total_score}`);
        console.log('');
    });

    // 如果有试卷，查看第一个试卷的题目
    if (rows.length > 0) {
        const firstPaperId = rows[0].id;
        console.log(`\n查看第一个试卷(${firstPaperId})的题目...`);
        
        db.all(`SELECT id, type, content, score FROM paper_questions WHERE paper_id = ? ORDER BY question_order`, [firstPaperId], (err, questions) => {
            if (err) {
                console.error('查询题目失败:', err);
            } else {
                console.log(`该试卷有 ${questions.length} 道题目:\n`);
                questions.forEach((q, i) => {
                    console.log(`  第${i+1}题 [${q.type}] ${q.content.substring(0, 50)}... (${q.score}分)`);
                });
            }
            db.close();
        });
    } else {
        db.close();
    }
});
