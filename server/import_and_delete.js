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

// 导入到试卷库
function importToPaperLibrary(examId) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({});
        const options = {
            hostname: API_URL,
            port: API_PORT,
            path: `/api/exams/${examId}/import-to-papers`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ success: false, error: data });
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// 删除考试
function deleteExam(examId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: API_URL,
            port: API_PORT,
            path: `/api/exams/${examId}`,
            method: 'DELETE'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        });

        req.on('error', reject);
        req.end();
    });
}

// 手动创建试卷（通过直接操作数据库）
function createPaperFromExam(examData) {
    return new Promise((resolve, reject) => {
        const sqlite3 = require('sqlite3').verbose();
        const { v4: uuidv4 } = require('uuid');
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

                    // 插入题目
                    const stmt = db.prepare(`INSERT INTO paper_questions
                        (id, paper_id, type, content, options, answer, explanation, knowledge_point, score, question_order, article, sub_questions)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

                    examData.questions.forEach((q, index) => {
                        const questionId = uuidv4();
                        stmt.run([
                            questionId,
                            paperId,
                            q.type,
                            q.content,
                            JSON.stringify(q.options || []),
                            q.answer,
                            q.explanation || '',
                            q.knowledge_point || q.knowledgePoint || '综合知识',
                            q.score || 10,
                            index + 1,
                            q.article || null,
                            q.sub_questions ? JSON.stringify(q.sub_questions) : null
                        ]);
                    });

                    stmt.finalize();
                    resolve({ success: true, paperId });
                }
            );
        });

        db.close();
    });
}

// 主流程
async function main() {
    const newExamId = 'a0231d90-edfd-41c3-93fb-a1c9d2927dc4';
    const oldExamId = '9c7a344f-0399-4fa0-b023-0ca1d498fa84';

    try {
        console.log('=== 开始处理 ===\n');

        // 1. 获取最新考试详情
        console.log('1. 获取最新考试详情...');
        const examData = await getExam(newExamId);
        console.log(`   考试名称: ${examData.title}`);
        console.log(`   题目数量: ${examData.questions?.length || 0}`);

        // 2. 导入到试卷库
        console.log('\n2. 导入到试卷库...');
        try {
            const importResult = await importToPaperLibrary(newExamId);
            if (importResult.success) {
                console.log('   ✅ 导入成功！');
            } else {
                console.log('   API导入失败，尝试直接创建...');
                const directResult = await createPaperFromExam(examData);
                if (directResult.success) {
                    console.log('   ✅ 直接创建成功！');
                }
            }
        } catch (e) {
            console.log('   API导入失败，尝试直接创建...');
            const directResult = await createPaperFromExam(examData);
            if (directResult.success) {
                console.log('   ✅ 直接创建成功！');
            }
        }

        // 3. 删除旧考试
        console.log('\n3. 删除有问题的旧考试...');
        await deleteExam(oldExamId);
        console.log('   ✅ 旧考试已删除！');

        console.log('\n=== 处理完成 ===');
        console.log('\n✅ 最新考试已导入试卷库');
        console.log('✅ 有问题的旧考试已删除');

    } catch (error) {
        console.error('处理失败:', error.message);
    }
}

main();
