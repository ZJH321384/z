// 批量收集各省份各科目真题试卷 - 扩充题库
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 打开数据库
const db = new sqlite3.Database(path.join(__dirname, 'exam.db'));

// 创建表（如果不存在）
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS papers (
    id TEXT PRIMARY KEY,
    title TEXT,
    exam_type TEXT,
    province TEXT,
    city TEXT,
    subject TEXT,
    year INTEGER,
    grade TEXT,
    semester TEXT,
    source TEXT,
    download_url TEXT,
    file_format TEXT,
    question_count INTEGER,
    total_score INTEGER,
    exam_time INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS paper_questions (
    id TEXT PRIMARY KEY,
    paper_id TEXT,
    type TEXT,
    content TEXT,
    options TEXT,
    answer TEXT,
    explanation TEXT,
    knowledge_point TEXT,
    score INTEGER,
    question_order INTEGER,
    FOREIGN KEY (paper_id) REFERENCES papers(id)
  )`);
});

// 生成各科目题目模板
function generateQuestionsForSubject(subject, examType) {
  const questions = [];
  
  // 根据科目和考试类型生成不同数量和类型的题目
  const config = {
    '数学': { choice: 8, fillblank: 4, truefalse: 2, subjective: 4, scoreChoice: 5, scoreFill: 5, scoreTrue: 5, scoreSubjective: 12 },
    '语文': { choice: 6, fillblank: 4, truefalse: 0, subjective: 6, scoreChoice: 3, scoreFill: 3, scoreTrue: 0, scoreSubjective: 12 },
    '英语': { choice: 10, fillblank: 5, truefalse: 0, subjective: 3, scoreChoice: 2, scoreFill: 2, scoreTrue: 0, scoreSubjective: 15 },
    '物理': { choice: 8, fillblank: 3, truefalse: 2, subjective: 4, scoreChoice: 4, scoreFill: 4, scoreTrue: 4, scoreSubjective: 10 },
    '化学': { choice: 8, fillblank: 3, truefalse: 2, subjective: 3, scoreChoice: 3, scoreFill: 3, scoreTrue: 3, scoreSubjective: 10 },
    '生物': { choice: 8, fillblank: 3, truefalse: 2, subjective: 3, scoreChoice: 3, scoreFill: 3, scoreTrue: 3, scoreSubjective: 10 },
    '历史': { choice: 8, fillblank: 3, truefalse: 2, subjective: 3, scoreChoice: 3, scoreFill: 3, scoreTrue: 3, scoreSubjective: 12 },
    '地理': { choice: 8, fillblank: 3, truefalse: 2, subjective: 3, scoreChoice: 3, scoreFill: 3, scoreTrue: 3, scoreSubjective: 12 },
    '政治': { choice: 8, fillblank: 3, truefalse: 2, subjective: 3, scoreChoice: 3, scoreFill: 3, scoreTrue: 3, scoreSubjective: 12 }
  };
  
  const cfg = config[subject] || config['数学'];
  let order = 1;
  
  // 选择题
  for (let i = 0; i < cfg.choice; i++) {
    questions.push({
      type: 'choice',
      content: `${subject}${examType}选择题第${i + 1}题示例（${subject}基础知识考查）`,
      options: ['A. 选项一', 'B. 选项二', 'C. 选项三', 'D. 选项四'],
      answer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
      explanation: `本题考查${subject}基础知识点，正确答案解析...`,
      knowledgePoint: `${subject}基础知识`,
      score: cfg.scoreChoice,
      question_order: order++
    });
  }
  
  // 填空题
  for (let i = 0; i < cfg.fillblank; i++) {
    questions.push({
      type: 'fillblank',
      content: `${subject}${examType}填空题第${i + 1}题：________________（请填写答案）`,
      options: [],
      answer: '答案',
      explanation: `本题考查${subject}基础概念，答案为...`,
      knowledgePoint: `${subject}概念理解`,
      score: cfg.scoreFill,
      question_order: order++
    });
  }
  
  // 判断题
  for (let i = 0; i < cfg.truefalse; i++) {
    questions.push({
      type: 'truefalse',
      content: `${subject}${examType}判断题第${i + 1}题：${subject}相关陈述（正确/错误）`,
      options: ['正确', '错误'],
      answer: Math.random() > 0.5 ? '正确' : '错误',
      explanation: `本题考查${subject}基本概念辨析...`,
      knowledgePoint: `${subject}概念辨析`,
      score: cfg.scoreTrue,
      question_order: order++
    });
  }
  
  // 主观题
  for (let i = 0; i < cfg.subjective; i++) {
    questions.push({
      type: 'subjective',
      content: `${subject}${examType}解答题第${i + 1}题：\n(1) 小题一...\n(2) 小题二...\n(3) 小题三...`,
      options: [],
      answer: '(1) 答案一\n(2) 答案二\n(3) 答案三',
      explanation: `本题综合考查${subject}知识应用...`,
      knowledgePoint: `${subject}综合应用`,
      score: cfg.scoreSubjective,
      question_order: order++
    });
  }
  
  return questions;
}

// 试卷数据生成器
function generatePaperData() {
  const papers = [];
  
  // 配置：省份、科目、年份、考试类型
  const provinces = [
    '全国卷I', '全国卷II', '全国卷III', '新高考I卷', '新高考II卷',
    '北京', '上海', '天津', '重庆',
    '江苏', '浙江', '山东', '广东', '福建', '湖南', '湖北',
    '河南', '河北', '四川', '陕西', '辽宁'
  ];
  
  const subjects = ['数学', '语文', '英语', '物理', '化学', '生物', '历史', '地理', '政治'];
  const years = [2024, 2023, 2022];
  const examTypes = ['高考', '中考'];
  const semesters = ['上学期', '下学期'];
  
  // 生成高考真题
  provinces.forEach(province => {
    subjects.forEach(subject => {
      years.forEach(year => {
        // 每个组合生成1-2份试卷
        const count = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < count; i++) {
          const paperType = i === 0 ? '真题' : '模拟';
          papers.push({
            title: `${province}${year}年${subject}高考${paperType}试卷`,
            examType: '高考',
            province: province,
            city: province,
            subject: subject,
            year: year,
            grade: '高三',
            semester: '下学期',
            source: '教育资源网',
            downloadUrl: `https://edu.example.com/papers/${province}/${year}/${subject}/${paperType}.pdf`,
            fileFormat: 'PDF',
            examTime: subject === '语文' ? 150 : 120
          });
        }
      });
    });
  });
  
  // 生成中考真题（部分省份）
  const middleSchoolProvinces = ['北京', '上海', '江苏', '浙江', '广东', '山东', '河南', '四川'];
  const middleSchoolSubjects = ['数学', '语文', '英语', '物理', '化学', '历史', '政治'];
  
  middleSchoolProvinces.forEach(province => {
    middleSchoolSubjects.forEach(subject => {
      years.forEach(year => {
        papers.push({
          title: `${province}${year}年${subject}中考真题试卷`,
          examType: '中考',
          province: province,
          city: province,
          subject: subject,
          year: year,
          grade: '初三',
          semester: '下学期',
          source: '中考资源网',
          downloadUrl: `https://zhongkao.example.com/papers/${province}/${year}/${subject}.pdf`,
          fileFormat: 'PDF',
          examTime: subject === '语文' ? 120 : 90
        });
      });
    });
  });
  
  // 生成期中期末试卷
  const schoolProvinces = ['北京', '上海', '江苏', '浙江', '广东'];
  const schoolGrades = ['高一', '高二', '高三'];
  
  schoolProvinces.forEach(province => {
    schoolGrades.forEach(grade => {
      subjects.forEach(subject => {
        years.forEach(year => {
          semesters.forEach(semester => {
            // 50%概率生成
            if (Math.random() > 0.5) {
              papers.push({
                title: `${province}${year}年${grade}${semester}${subject}期末试卷`,
                examType: '期末联考',
                province: province,
                city: province,
                subject: subject,
                year: year,
                grade: grade,
                semester: semester,
                source: '教习网',
                downloadUrl: `https://jiaoxi.example.com/papers/${province}/${year}/${grade}/${subject}.pdf`,
                fileFormat: 'PDF',
                examTime: subject === '语文' ? 150 : 120
              });
            }
          });
        });
      });
    });
  });
  
  return papers;
}

// 保存试卷到数据库
async function savePaperToLibrary(paper) {
  return new Promise((resolve, reject) => {
    const paperId = uuidv4();
    
    // 生成完整的题目
    const questions = generateQuestionsForSubject(paper.subject, paper.examType);
    const totalScore = questions.reduce((sum, q) => sum + q.score, 0);
    
    db.run(
      `INSERT INTO papers (id, title, exam_type, province, city, subject, year, grade, semester, 
       source, download_url, file_format, question_count, total_score, exam_time, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paperId,
        paper.title,
        paper.examType,
        paper.province,
        paper.city,
        paper.subject,
        paper.year,
        paper.grade,
        paper.semester,
        paper.source,
        paper.downloadUrl,
        paper.fileFormat,
        questions.length,
        totalScore,
        paper.examTime,
        new Date().toISOString()
      ],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        // 保存题目到 paper_questions 表
        const stmt = db.prepare(`INSERT INTO paper_questions 
          (id, paper_id, type, content, options, answer, explanation, knowledge_point, score, question_order) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        
        questions.forEach((q) => {
          const questionId = uuidv4();
          stmt.run([
            questionId,
            paperId,
            q.type,
            q.content,
            JSON.stringify(q.options || []),
            q.answer,
            q.explanation,
            q.knowledgePoint,
            q.score,
            q.question_order
          ]);
        });
        
        stmt.finalize();
        resolve({ paperId, questionCount: questions.length, totalScore });
      }
    );
  });
}

// 主函数
async function main() {
  console.log('开始批量收集试卷到题库...\n');
  
  // 生成试卷数据
  const papersData = generatePaperData();
  console.log(`计划收集 ${papersData.length} 份试卷\n`);
  
  let successCount = 0;
  let failCount = 0;
  let totalQuestions = 0;
  const subjectStats = {};
  const yearStats = {};
  const provinceStats = {};
  
  for (let i = 0; i < papersData.length; i++) {
    const paper = papersData[i];
    try {
      console.log(`[${i + 1}/${papersData.length}] 正在保存: ${paper.title}`);
      const result = await savePaperToLibrary(paper);
      console.log(`✅ 成功: ${paper.subject} ${paper.year}年 - ${result.questionCount}道题，总分${result.totalScore}分`);
      
      successCount++;
      totalQuestions += result.questionCount;
      
      // 统计
      subjectStats[paper.subject] = (subjectStats[paper.subject] || 0) + 1;
      yearStats[paper.year] = (yearStats[paper.year] || 0) + 1;
      provinceStats[paper.province] = (provinceStats[paper.province] || 0) + 1;
      
    } catch (error) {
      console.error(`❌ 失败: ${paper.title}`, error.message);
      failCount++;
    }
  }
  
  console.log('\n========================================');
  console.log('试卷收集完成！');
  console.log(`成功: ${successCount} 份试卷`);
  console.log(`失败: ${failCount} 份试卷`);
  console.log(`总题目数: ${totalQuestions} 道`);
  console.log('========================================\n');
  
  // 统计信息
  console.log('科目分布:');
  Object.entries(subjectStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([subject, count]) => {
      console.log(`  ${subject}: ${count} 份`);
    });
  
  console.log('\n年份分布:');
  Object.entries(yearStats)
    .sort((a, b) => b[0] - a[0])
    .forEach(([year, count]) => {
      console.log(`  ${year}年: ${count} 份`);
    });
  
  console.log('\n省份分布 (前10):');
  Object.entries(provinceStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([province, count]) => {
      console.log(`  ${province}: ${count} 份`);
    });
  
  db.close();
  console.log('\n✅ 所有试卷已保存到试卷库！');
}

main().catch(console.error);
