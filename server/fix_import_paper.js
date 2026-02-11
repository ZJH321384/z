const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const http = require('http');

const API_URL = 'localhost';
const API_PORT = 3001;

// 获取考试详情
function getExam(examId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: API_URL,
            port: API_PORT,
            path: `/api/exams/${examId}`,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// 创建试卷和题目
function createPaperWithQuestions(examData) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database('./exam.db');
        const paperId = uuidv4();
        const now = new Date().toISOString();

        db.serialize(() => {
            // 插入试卷基本信息
            db.run(
                `INSERT INTO papers (id, title, exam_type, province, subject, year, grade, question_count, total_score, exam_time, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    paperId,
                    examData.title,
                    '期中考试',
                    '校本',
                    examData.subject,
                    2026,
                    examData.grade,
                    examData.questions.length,
                    examData.questions.reduce((sum, q) => sum + (q.score || 10), 0),
                    examData.time_limit || 120,
                    now
                ],
                function(err) {
                    if (err) {
                        console.error('插入试卷失败:', err);
                        reject(err);
                        return;
                    }

                    console.log(`   试卷创建成功，ID: ${paperId}`);
                    console.log(`   准备导入 ${examData.questions.length} 道题目...`);

                    // 使用 Promise 等待所有题目插入完成
                    const insertPromises = examData.questions.map((q, index) => {
                        return new Promise((resolveInsert, rejectInsert) => {
                            const questionId = uuidv4();
                            const optionsStr = JSON.stringify(q.options || []);

                            db.run(
                                `INSERT INTO paper_questions
                                (id, paper_id, type, content, options, answer, explanation, knowledge_point, score, question_order)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [
                                    questionId,
                                    paperId,
                                    q.type,
                                    q.content,
                                    optionsStr,
                                    q.answer,
                                    q.explanation || '',
                                    q.knowledgePoint || q.knowledge_point || '综合知识',
                                    q.score || 10,
                                    index + 1
                                ],
                                function(err) {
                                    if (err) {
                                        console.error(`   第${index + 1}题插入失败:`, err.message);
                                        rejectInsert(err);
                                    } else {
                                        console.log(`   ✅ 第${index + 1}题导入成功`);
                                        resolveInsert();
                                    }
                                }
                            );
                        });
                    });

                    // 等待所有题目插入完成
                    Promise.all(insertPromises)
                        .then(() => {
                            console.log('   所有题目导入完成！');
                            db.close();
                            resolve({ success: true, paperId });
                        })
                        .catch((err) => {
                            console.error('   部分题目导入失败:', err);
                            db.close();
                            reject(err);
                        });
                }
            );
        });
    });
}

// 删除已存在的同名试卷
function deleteExistingPaper(title) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database('./exam.db');

        db.all(`SELECT id FROM papers WHERE title = ?`, [title], (err, rows) => {
            if (err) {
                db.close();
                reject(err);
                return;
            }

            if (rows.length === 0) {
                db.close();
                resolve();
                return;
            }

            console.log(`   发现 ${rows.length} 个同名试卷，准备删除...`);

            let deletedCount = 0;
            rows.forEach(row => {
                // 先删除关联的题目
                db.run(`DELETE FROM paper_questions WHERE paper_id = ?`, [row.id], (err) => {
                    if (err) console.error('删除题目失败:', err);

                    // 再删除试卷
                    db.run(`DELETE FROM papers WHERE id = ?`, [row.id], (err) => {
                        if (err) console.error('删除试卷失败:', err);
                        deletedCount++;
                        console.log(`   已删除旧试卷: ${row.id}`);

                        if (deletedCount >= rows.length) {
                            db.close();
                            resolve();
                        }
                    });
                });
            });
        });
    });
}

// 主流程
async function main() {
    const examId = 'a0231d90-edfd-41c3-93fb-a1c9d2927dc4';

    try {
        console.log('=== 重新导入试卷 ===\n');

        // 1. 获取考试详情
        console.log('1. 获取考试详情...');
        const examData = await getExam(examId);
        console.log(`   考试名称: ${examData.title}`);
        console.log(`   题目数量: ${examData.questions?.length || 0}`);

        // 2. 删除已存在的同名试卷
        console.log('\n2. 清理旧数据...');
        await deleteExistingPaper(examData.title);

        // 3. 创建新试卷和题目
        console.log('\n3. 导入试卷和题目...');
        const result = await createPaperWithQuestions(examData);

        if (result.success) {
            console.log('\n✅ 试卷导入成功！');
            console.log(`   试卷ID: ${result.paperId}`);
            console.log(`   题目数: ${examData.questions.length}`);
        }

        console.log('\n=== 完成 ===');

    } catch (error) {
        console.error('导入失败:', error.message);
    }
}

main();
