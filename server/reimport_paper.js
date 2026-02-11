const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

// 数学试卷数据（从create_math_exam.js复制）
const examData = {
    title: "高一数学综合测试卷",
    subject: "数学",
    grade: "高一",
    difficulty: "medium",
    questionCount: 10,
    timeLimit: 120,
    questions: [
        // 选择题（4题，每题10分）
        {
            type: "choice",
            content: "（集合单元）已知集合A={x|x≤2，x∈N}，B={x|x²-3x+2=0}，则A∪B等于（  ）",
            options: ["A. {1,2}", "B. {0,1,2,3}", "C. {0,1,2}", "D. {1,2,3}"],
            answer: "C",
            explanation: "集合A={0,1,2}，集合B={1,2}，所以A∪B={0,1,2}",
            knowledgePoint: "集合的并集运算",
            score: 10
        },
        {
            type: "choice",
            content: "（函数概念与性质）下列函数中，是奇函数且在定义域内单调递减的是（  ）",
            options: ["A. f(x)=x³", "B. f(x)=-x", "C. f(x)=|x|", "D. f(x)=2ˣ"],
            answer: "B",
            explanation: "f(x)=-x是奇函数（f(-x)=x=-f(x)），且在定义域内单调递减",
            knowledgePoint: "函数的奇偶性与单调性",
            score: 10
        },
        {
            type: "choice",
            content: "（基本初等函数）若a=log₃2，b=log₀.₅2，c=2⁰·³，则a、b、c的大小关系为（  ）",
            options: ["A. c>a>b", "B. a>c>b", "C. b>a>c", "D. c>b>a"],
            answer: "A",
            explanation: "a=log₃2∈(0,1)，b=log₀.₅2<0，c=2⁰·³>1，所以c>a>b",
            knowledgePoint: "对数与指数的大小比较",
            score: 10
        },
        {
            type: "choice",
            content: "（函数应用）已知二次函数f(x)=ax²+bx+c（a<0），对称轴为x=1，则下列说法正确的是（  ）",
            options: ["A. f(0)<f(2)", "B. f(-1)<f(3)", "C. f(1)是最小值", "D. f(0)>f(3)"],
            answer: "D",
            explanation: "因为a<0，抛物线开口向下，对称轴x=1，离对称轴越远函数值越小。f(0)离对称轴距离为1，f(3)离对称轴距离为2，所以f(0)>f(3)",
            knowledgePoint: "二次函数的图像与性质",
            score: 10
        },
        // 填空题（2题，每题15分）
        {
            type: "fillblank",
            content: "（函数定义域）函数f(x)=√(x+2)+1/(3-x)的定义域为________。",
            options: [],
            answer: "{x|-2≤x<3}",
            explanation: "由x+2≥0得x≥-2；由3-x≠0得x≠3。所以定义域为{x|-2≤x<3}",
            knowledgePoint: "函数定义域的求解",
            score: 15
        },
        {
            type: "fillblank",
            content: "（指数与对数运算）计算：log₂8 + 3⁰ - (1/9)⁻¹/² = ________。",
            options: [],
            answer: "2",
            explanation: "log₂8=3，3⁰=1，(1/9)⁻¹/²=9¹/²=3，所以原式=3+1-3=2",
            knowledgePoint: "指数与对数运算",
            score: 15
        },
        // 解答题（4题，每题20分）
        {
            type: "subjective",
            content: "（集合单元）已知集合A={x|x²-4x-5≤0}，B={x|x>1}，求：\n（1）A∩B；\n（2）∁ᵣA（R为实数集）。",
            options: [],
            answer: "（1）A∩B={x|1<x≤5}\n（2）∁ᵣA={x|x<-1或x>5}",
            explanation: "（1）先解方程x²-4x-5≤0，即(x-5)(x+1)≤0，解得-1≤x≤5，故A={x|-1≤x≤5}；A∩B表示A与B的公共元素，即{x|1<x≤5}（10分）\n（2）∁ᵣA表示实数集中不属于A的元素，即{x|x<-1或x>5}（10分）",
            knowledgePoint: "集合的交集与补集运算",
            score: 20
        },
        {
            type: "subjective",
            content: "（函数奇偶性）已知函数f(x)=x³ + (1/x)（x≠0），判断f(x)的奇偶性，并证明；判断f(x)在(0,+∞)上的单调性（无需证明）。",
            options: [],
            answer: "（1）f(x)是奇函数\n（2）f(x)在(0,+∞)上单调递增",
            explanation: "（1）判断奇偶性：函数定义域为{x|x≠0}，关于原点对称（5分）；证明：f(-x)=(-x)³ + (1/(-x))=-x³ - 1/x=-(x³ + 1/x)=-f(x)，故f(x)是奇函数（10分）\n（2）f(x)在(0,+∞)上单调递增（5分）",
            knowledgePoint: "函数的奇偶性判断与证明",
            score: 20
        },
        {
            type: "subjective",
            content: "（二次函数）已知二次函数f(x)=x²-2x-3，求：\n（1）函数f(x)的顶点坐标和对称轴；\n（2）f(x)在区间[-1,2]上的最大值和最小值。",
            options: [],
            answer: "（1）顶点坐标为(1,-4)，对称轴为x=1\n（2）最大值为0，最小值为-4",
            explanation: "（1）将函数化为顶点式：f(x)=(x-1)²-4，故顶点坐标为(1,-4)，对称轴为x=1（10分）\n（2）函数开口向上，对称轴x=1在区间[-1,2]内，最小值为f(1)=-4；计算端点值：f(-1)=(-1)²-2×(-1)-3=0，f(2)=2²-2×2-3=-3，故最大值为0，最小值为-4（10分）",
            knowledgePoint: "二次函数的顶点式与最值",
            score: 20
        },
        {
            type: "subjective",
            content: "（函数实际应用）某商店销售一种进价为20元/件的商品，售价为x元/件（x≥20），每天的销售量y（件）与售价x（元/件）的关系为y=-5x+250，设每天的利润为W（元）。\n（1）求W与x之间的函数关系式；\n（2）售价定为多少元时，每天的利润最大？最大利润是多少？",
            options: [],
            answer: "（1）W=-5x²+350x-5000（x≥20）\n（2）售价定为35元时，每天的利润最大，最大利润为1125元",
            explanation: "（1）利润=（售价-进价）×销售量，即W=(x-20)y=(x-20)(-5x+250)，化简得：W=-5x²+350x-5000（x≥20）（10分）\n（2）W=-5x²+350x-5000是二次函数，a=-5<0，开口向下，对称轴为x=-b/(2a)=-350/(2×(-5))=35，对称轴x=35≥20，在定义域内，将x=35代入得最大利润W=-5×35²+350×35-5000=1125（元），故售价定为35元时，每天的利润最大，最大利润为1125元（10分）",
            knowledgePoint: "二次函数的实际应用",
            score: 20
        }
    ]
};

// 删除旧试卷
function deleteOldPapers(title) {
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

            console.log(`发现 ${rows.length} 个同名试卷，正在删除...`);

            let completed = 0;
            rows.forEach(row => {
                // 先删除题目
                db.run(`DELETE FROM paper_questions WHERE paper_id = ?`, [row.id], (err) => {
                    if (err) console.error('删除题目失败:', err);

                    // 再删除试卷
                    db.run(`DELETE FROM papers WHERE id = ?`, [row.id], (err) => {
                        if (err) console.error('删除试卷失败:', err);
                        completed++;
                        if (completed >= rows.length) {
                            db.close();
                            resolve();
                        }
                    });
                });
            });
        });
    });
}

// 创建试卷和题目
function createPaper() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database('./exam.db');
        const paperId = uuidv4();
        const now = new Date().toISOString();

        console.log('正在创建试卷...');

        db.serialize(() => {
            // 插入试卷
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
                    examData.questions.reduce((sum, q) => sum + q.score, 0),
                    examData.timeLimit,
                    now
                ],
                function(err) {
                    if (err) {
                        console.error('创建试卷失败:', err);
                        db.close();
                        reject(err);
                        return;
                    }

                    console.log(`试卷创建成功: ${paperId}`);
                    console.log(`准备导入 ${examData.questions.length} 道题目...`);

                    // 准备插入题目
                    const stmt = db.prepare(`INSERT INTO paper_questions
                        (id, paper_id, type, content, options, answer, explanation, knowledge_point, score, question_order)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

                    let successCount = 0;
                    let errorCount = 0;

                    examData.questions.forEach((q, index) => {
                        const questionId = uuidv4();

                        stmt.run([
                            questionId,
                            paperId,
                            q.type,
                            q.content,
                            JSON.stringify(q.options),
                            q.answer,
                            q.explanation,
                            q.knowledgePoint,
                            q.score,
                            index + 1
                        ], (err) => {
                            if (err) {
                                console.error(`第${index + 1}题导入失败:`, err.message);
                                errorCount++;
                            } else {
                                successCount++;
                                console.log(`✅ 第${index + 1}题导入成功`);
                            }

                            // 检查是否全部完成
                            if (successCount + errorCount >= examData.questions.length) {
                                stmt.finalize();
                                db.close();
                                console.log(`\n导入完成: ${successCount} 成功, ${errorCount} 失败`);
                                resolve({ success: true, paperId, successCount, errorCount });
                            }
                        });
                    });
                }
            );
        });
    });
}

// 主流程
async function main() {
    try {
        console.log('=== 重新导入数学试卷 ===\n');

        // 1. 删除旧试卷
        console.log('1. 清理旧数据...');
        await deleteOldPapers(examData.title);
        console.log('');

        // 2. 创建新试卷
        console.log('2. 创建新试卷和题目...');
        const result = await createPaper();

        if (result.success && result.errorCount === 0) {
            console.log('\n✅ 试卷导入成功！');
            console.log(`试卷ID: ${result.paperId}`);
            console.log(`题目数量: ${result.successCount}`);
        } else {
            console.log('\n⚠️ 部分题目导入失败');
        }

        console.log('\n=== 完成 ===');

    } catch (error) {
        console.error('导入失败:', error.message);
    }
}

main();
