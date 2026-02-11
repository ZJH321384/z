const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generateQuestions } = require('./questionGenerator');
const { 
  paperConfig, 
  batchSearchPapers, 
  savePaperToDatabase, 
  getCollectedPapers,
  getCollectionStats 
} = require('./paperCollector');
const { parseWordDocument, formatAsPaper } = require('./wordParser');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

// 确保上传目录存在
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// 配置文件上传 - 磁盘存储（用于图片）
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// 内存存储（用于Word文档解析）
const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({ storage: memoryStorage });

// 初始化数据库
const db = new sqlite3.Database('./exam.db');

db.serialize(() => {
  // 考试表
  db.run(`CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    title TEXT,
    subject TEXT,
    grade TEXT,
    difficulty TEXT,
    question_count INTEGER,
    time_limit INTEGER,
    status TEXT DEFAULT 'pending',
    grading_status TEXT DEFAULT 'pending',
    exam_class TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 题目表
  db.run(`CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    exam_id TEXT,
    type TEXT,
    content TEXT,
    options TEXT,
    answer TEXT,
    explanation TEXT,
    knowledge_point TEXT,
    score INTEGER,
    article TEXT,
    sub_questions TEXT,
    FOREIGN KEY (exam_id) REFERENCES exams(id)
  )`);

  // 学生答题表
  db.run(`CREATE TABLE IF NOT EXISTS student_answers (
    id TEXT PRIMARY KEY,
    exam_id TEXT,
    student_name TEXT,
    student_id TEXT,
    class_name TEXT,
    question_id TEXT,
    answer TEXT,
    image_path TEXT,
    is_correct INTEGER,
    score INTEGER,
    teacher_comment TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id),
    FOREIGN KEY (question_id) REFERENCES questions(id)
  )`);

  // 试卷库表（独立存储，不清空）
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

  // 试卷题目表（关联到试卷库）
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
    article TEXT,
    sub_questions TEXT,
    FOREIGN KEY (paper_id) REFERENCES papers(id)
  )`);

  // 教师用户表
  db.run(`CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    name TEXT,
    subject TEXT,
    classes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 教师批改任务分配表
  db.run(`CREATE TABLE IF NOT EXISTS teacher_tasks (
    id TEXT PRIMARY KEY,
    exam_id TEXT,
    question_id TEXT,
    student_answer_id TEXT,
    teacher_id TEXT,
    student_name TEXT,
    student_id TEXT,
    subject TEXT,
    sub_question_index INTEGER DEFAULT -1,
    sub_question_content TEXT,
    sub_question_answer TEXT,
    sub_question_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    assigned_score INTEGER,
    teacher_comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    graded_at DATETIME,
    FOREIGN KEY (exam_id) REFERENCES exams(id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
  )`);
});

// 添加新列（如果表已存在）
db.run(`ALTER TABLE student_answers ADD COLUMN is_correct INTEGER`, (err) => {
  // 忽略错误（列已存在时会报错）
});
db.run(`ALTER TABLE student_answers ADD COLUMN score INTEGER`, (err) => {
  // 忽略错误（列已存在时会报错）
});
db.run(`ALTER TABLE questions ADD COLUMN difficulty TEXT`, (err) => {
  // 忽略错误（列已存在时会报错）
});

// 添加 papers 表的 city 列（如果不存在）
db.run(`ALTER TABLE papers ADD COLUMN city TEXT`, (err) => {
  // 忽略错误（列已存在时会报错）
});

// 创建试卷表（已在上面的 serialize 中创建，这里保留 ALTER 语句以兼容旧表）
db.run(`CREATE TABLE IF NOT EXISTS papers (
  id TEXT PRIMARY KEY,
  title TEXT,
  exam_type TEXT,
  province TEXT,
  subject TEXT,
  year INTEGER,
  source TEXT,
  download_url TEXT,
  file_format TEXT,
  question_count INTEGER,
  total_score INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// ===== API 路由 =====

// 生成题目
app.post('/api/generate-questions', (req, res) => {
  const { subject, grade, difficulty, count, types } = req.body;
  
  try {
    const questions = generateQuestions(subject, grade, difficulty, count, types);
    res.json({ success: true, questions });
  } catch (error) {
    console.error('生成题目失败:', error);
    res.status(500).json({ error: '生成题目失败' });
  }
});

// 创建考试
app.post('/api/exams', (req, res) => {
  const { title, subject, grade, difficulty, questionCount, timeLimit, questions } = req.body;
  const examId = uuidv4();

  db.run(
    `INSERT INTO exams (id, title, subject, grade, difficulty, question_count, time_limit) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [examId, title, subject, grade, difficulty, questionCount, timeLimit],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 插入题目
      const stmt = db.prepare(`INSERT INTO questions 
        (id, exam_id, type, content, options, answer, explanation, knowledge_point, score, article, sub_questions) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

      questions.forEach((q, index) => {
        const questionId = uuidv4();
        stmt.run([
          questionId,
          examId,
          q.type,
          q.content,
          JSON.stringify(q.options || []),
          q.answer,
          q.explanation,
          q.knowledgePoint,
          q.score || 10,
          q.article || null,
          q.subQuestions ? JSON.stringify(q.subQuestions) : null
        ]);
      });
      stmt.finalize();

      res.json({ 
        success: true, 
        examId: examId,
        message: '考试创建成功' 
      });
    }
  );
});

// 获取考试列表
app.get('/api/exams', (req, res) => {
  db.all(`SELECT * FROM exams ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 获取单个考试信息
app.get('/api/exams/:id', (req, res) => {
  const examId = req.params.id;
  
  db.get(`SELECT * FROM exams WHERE id = ?`, [examId], (err, exam) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!exam) {
      res.status(404).json({ error: '考试不存在' });
      return;
    }

    db.all(`SELECT * FROM questions WHERE exam_id = ?`, [examId], (err, questions) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // 解析选项 JSON 和其他字段
      questions.forEach(q => {
        console.log(`题目 ${q.id}: type=${q.type}, article=${q.article ? '有' : '无'}, sub_questions=${q.sub_questions ? '有' : '无'}`);
        
        if (q.options) {
          try {
            q.options = JSON.parse(q.options);
          } catch (e) {
            q.options = [];
          }
        }
        // 解析 sub_questions（映射为前端用的 subQuestions）
        if (q.sub_questions) {
          try {
            let parsed = JSON.parse(q.sub_questions);
            // 如果解析后还是字符串，说明被双重转义了，需要再解析一次
            if (typeof parsed === 'string') {
              parsed = JSON.parse(parsed);
            }
            q.subQuestions = parsed;
            console.log(`  解析 subQuestions 成功: ${parsed.length} 道子题`);
          } catch (e) {
            console.error(`  解析 sub_questions 失败:`, e.message);
            q.subQuestions = [];
          }
        }
      });

      res.json({ ...exam, questions });
    });
  });
});

// 开始考试
app.post('/api/exams/:id/start', (req, res) => {
  const examId = req.params.id;
  const { examClass } = req.body;

  // 如果有指定考试班级，则更新
  if (examClass) {
    db.run(`UPDATE exams SET status = 'active', exam_class = ? WHERE id = ?`, [examClass, examId], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 通知所有客户端考试开始
      io.emit('exam-started', { examId, examClass });

      res.json({ success: true, message: '考试已开始', examClass });
    });
  } else {
    db.run(`UPDATE exams SET status = 'active' WHERE id = ?`, [examId], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 通知所有客户端考试开始
      io.emit('exam-started', { examId });

      res.json({ success: true, message: '考试已开始' });
    });
  }
});

// 结束考试
app.post('/api/exams/:id/end', (req, res) => {
  const examId = req.params.id;
  console.log(`收到结束考试请求: ${examId}`);
  
  db.run(`UPDATE exams SET status = 'ended' WHERE id = ?`, [examId], function(err) {
    if (err) {
      console.error('结束考试失败:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    
    console.log(`考试 ${examId} 状态已更新为 ended`);
    
    // 自动批改客观题
    console.log('开始调用自动批改函数...');
    autoGradeExam(examId);
    
    io.emit('exam-ended', { examId });
    
    res.json({ success: true, message: '考试已结束，系统正在自动批改...' });
  });
});

// 自动批改考试（批改选择题和阅读理解题中的选择题）
function autoGradeExam(examId) {
  console.log(`开始自动批改考试 ${examId}`);
  
  // 获取所有题目（包括选择题、判断题和阅读理解题）
  // 注意：阅读理解题可能被保存为 'reading' 或 'subjective' 类型
  db.all(`SELECT id, answer, score, type, sub_questions FROM questions WHERE exam_id = ?`, [examId], (err, questions) => {
    if (err) {
      console.error('获取题目失败:', err);
      return;
    }
    
    console.log(`获取到 ${questions.length} 道需要批改的题目`);
    
    const questionMap = {};
    const readingQuestions = [];
    
    questions.forEach(q => {
      console.log(`题目 ${q.id}: 类型=${q.type}, sub_questions=${q.sub_questions ? '有' : '无'}`);
      
      if (q.type === 'choice' || q.type === 'truefalse') {
        // 普通选择题和判断题
        questionMap[q.id] = { answer: q.answer, score: q.score, type: q.type };
        console.log(`  添加到普通选择题批改列表`);
      } else if (q.type === 'reading' || q.type === 'subjective') {
        // 阅读理解题或主观题（可能包含子题目）
        // 解析子题目
        let subQuestions = [];
        console.log(`  检查 sub_questions: ${q.sub_questions ? q.sub_questions.substring(0, 100) : 'null'}`);
        if (q.sub_questions) {
          try {
            let parsed = JSON.parse(q.sub_questions);
            console.log(`  第一次解析结果类型: ${typeof parsed}, 是否为数组: ${Array.isArray(parsed)}`);
            
            // 如果解析后还是字符串，说明被双重转义了，需要再解析一次
            if (typeof parsed === 'string') {
              console.log(`  检测到双重转义，进行第二次解析`);
              parsed = JSON.parse(parsed);
              console.log(`  第二次解析结果类型: ${typeof parsed}, 是否为数组: ${Array.isArray(parsed)}`);
            }
            
            if (Array.isArray(parsed)) {
              subQuestions = parsed;
              console.log(`  解析到 ${subQuestions.length} 道子题目`);
              if (subQuestions.length > 0) {
                console.log(`  第一道题类型: ${subQuestions[0].type}`);
              }
            } else {
              console.log(`  解析结果不是数组: ${parsed}`);
            }
          } catch (e) {
            console.error('解析 sub_questions 失败:', e.message);
            console.error('原始数据:', q.sub_questions.substring(0, 200));
          }
        } else {
          console.log(`  sub_questions 为空`);
        }
        
        if (subQuestions.length > 0) {
          // 检查是否包含选择题
          const hasChoice = subQuestions.some(sq => sq.type === 'choice');
          const hasShortAnswer = subQuestions.some(sq => sq.type === 'shortanswer');
          console.log(`  是否有选择题: ${hasChoice}, 是否有简答题: ${hasShortAnswer}, 子题目数: ${subQuestions.length}`);
          
          if (hasChoice) {
            // 包含选择题，需要自动批改（即使也有简答题）
            readingQuestions.push({
              id: q.id,
              score: q.score,
              subQuestions: subQuestions
            });
            console.log(`  添加到阅读理解自动批改列表（只自动批改选择题部分）`);
          }
        } else {
          console.log(`  没有子题目，视为普通主观题`);
        }
      }
    });
    
    console.log(`普通选择题: ${Object.keys(questionMap).length} 道`);
    console.log(`阅读理解题(全选择题): ${readingQuestions.length} 道`);
    
    // 获取所有学生答案
    db.all(`SELECT id, question_id, answer FROM student_answers WHERE exam_id = ?`, [examId], (err, answers) => {
      if (err) {
        console.error('获取答案失败:', err);
        return;
      }
      
      // 批改普通选择题
      answers.forEach(answer => {
        const question = questionMap[answer.question_id];
        if (question && question.type === 'choice') {
          const isCorrect = answer.answer === question.answer;
          const score = isCorrect ? question.score : 0;
          
          db.run(
            `UPDATE student_answers SET is_correct = ?, score = ? WHERE id = ?`,
            [isCorrect ? 1 : 0, score, answer.id]
          );
        }
      });
      
      // 批改阅读理解题（包括包含简答题的情况，只批改选择题部分）
      readingQuestions.forEach(rq => {
        const studentAnswer = answers.find(a => a.question_id === rq.id);
        if (studentAnswer && studentAnswer.answer) {
          // 解析学生答案格式：支持 "第1题：A\n第2题：B" 或 "第1题：A 第2题：B"
          const studentAnswers = {};
          // 先尝试按换行分割，如果没有换行则按"第"分割
          let lines = studentAnswer.answer.split('\n');
          if (lines.length === 1) {
            // 没有换行，按"第"分割（去掉第一个空字符串）
            lines = studentAnswer.answer.split('第').filter(l => l.trim());
            lines = lines.map(l => '第' + l); // 重新加上"第"
          }
          
          lines.forEach(line => {
            const match = line.match(/第(\d+)题[：:]\s*(.+)/);
            if (match) {
              studentAnswers[parseInt(match[1]) - 1] = match[2].trim();
            }
          });
          
          console.log('解析学生答案:', studentAnswers);
          console.log('正确答案:', rq.subQuestions.map((sq, i) => `第${i+1}题: ${sq.answer}`));
          
          // 计算得分（只计算选择题部分）
          let totalScore = 0;
          let choiceTotalScore = 0; // 选择题总分
          rq.subQuestions.forEach((sq, idx) => {
            if (sq.type === 'choice') {
              choiceTotalScore += sq.score;
              console.log(`对比第${idx+1}题(选择题): 学生答案[${studentAnswers[idx]}] vs 正确答案[${sq.answer}]`);
              if (studentAnswers[idx] === sq.answer) {
                totalScore += sq.score;
              }
            }
          });
          
          console.log(`阅读理解题选择题得分: ${totalScore}/${choiceTotalScore} (简答题需人工批改)`);
          
          // 更新分数（只包含选择题得分，简答题分数为0等待人工批改）
          db.run(
            `UPDATE student_answers SET is_correct = ?, score = ? WHERE id = ?`,
            [0, totalScore, studentAnswer.id]
          );
        }
      });
      
      console.log(`考试 ${examId} 自动批改完成`);
      
      // 分配主观题给教师批改
      assignSubjectiveQuestionsToTeachers(examId);
    });
  });
}

// 分配主观题给教师批改
function assignSubjectiveQuestionsToTeachers(examId) {
  console.log(`开始分配主观题给教师，考试ID: ${examId}`);
  
  // 获取考试信息（科目）
  db.get(`SELECT subject FROM exams WHERE id = ?`, [examId], (err, exam) => {
    if (err || !exam) {
      console.error('获取考试信息失败:', err);
      return;
    }
    
    const subject = exam.subject;
    console.log(`考试科目: ${subject}`);
    
    // 获取该科目的所有教师
    db.all(`SELECT id FROM teachers WHERE subject = ?`, [subject], (err, teachers) => {
      if (err || teachers.length === 0) {
        console.error(`没有找到${subject}科目的教师`);
        return;
      }
      
      console.log(`找到 ${teachers.length} 位${subject}教师`);
      
      // 获取所有需要人工批改的题目（主观题和阅读理解题中的简答题）
      db.all(`SELECT * FROM questions WHERE exam_id = ?`, [examId], (err, questions) => {
        if (err) {
          console.error('获取题目失败:', err);
          return;
        }
        
        const subjectiveQuestions = [];
        
        questions.forEach(q => {
          if (q.type === 'subjective' || q.type === 'fillblank') {
            // 主观题和填空题需要人工批改
            subjectiveQuestions.push({
              id: q.id,
              type: q.type,
              fullQuestion: true
            });
          } else if (q.type === 'reading' && q.sub_questions) {
            // 阅读理解题，检查是否有简答题
            try {
              let subQuestions = JSON.parse(q.sub_questions);
              if (typeof subQuestions === 'string') {
                subQuestions = JSON.parse(subQuestions);
              }
              
              if (Array.isArray(subQuestions)) {
                subQuestions.forEach((sq, idx) => {
                  if (sq.type === 'shortanswer') {
                    subjectiveQuestions.push({
                      id: q.id,
                      type: 'reading',
                      subQuestionIndex: idx,
                      subQuestion: sq,
                      fullQuestion: false
                    });
                  }
                });
              }
            } catch (e) {
              console.error('解析sub_questions失败:', e);
            }
          }
        });
        
        console.log(`找到 ${subjectiveQuestions.length} 道需要人工批改的题目`);
        
        if (subjectiveQuestions.length === 0) {
          console.log('没有需要人工批改的题目');
          return;
        }
        
        // 获取所有学生的答案
        db.all(`SELECT * FROM student_answers WHERE exam_id = ?`, [examId], (err, answers) => {
          if (err) {
            console.error('获取学生答案失败:', err);
            return;
          }
          
          console.log(`获取到 ${answers.length} 条学生答案`);
          
          // 按题号分配教师：同一题号的所有学生答案分配给同一个教师
          // 创建题号到教师的映射
          const questionToTeacherMap = {};
          subjectiveQuestions.forEach((sq, index) => {
            // 使用轮询方式将题号分配给教师
            const teacher = teachers[index % teachers.length];
            const questionKey = sq.type === 'reading' && sq.subQuestionIndex !== undefined 
              ? `${sq.id}_sub_${sq.subQuestionIndex}` 
              : sq.id;
            questionToTeacherMap[questionKey] = teacher;
            console.log(`题号 ${questionKey} 分配给教师 ${teacher.id}`);
          });
          
          // 为每道主观题的每个答案创建任务
          let taskIndex = 0;
          
          answers.forEach(answer => {
            const matchedQuestion = subjectiveQuestions.find(sq => sq.id === answer.question_id);
            if (matchedQuestion) {
              // 根据题号获取分配的教师
              const questionKey = matchedQuestion.type === 'reading' && matchedQuestion.subQuestionIndex !== undefined 
                ? `${matchedQuestion.id}_sub_${matchedQuestion.subQuestionIndex}` 
                : matchedQuestion.id;
              const teacher = questionToTeacherMap[questionKey];
              
              if (!teacher) {
                console.error(`题号 ${questionKey} 没有分配教师`);
                return;
              }
              
              if (matchedQuestion.type === 'reading' && matchedQuestion.subQuestion) {
                // 阅读理解题的简答题，创建单独的任务
                const taskId = uuidv4();
                const sq = matchedQuestion.subQuestion;
                
                db.run(
                  `INSERT INTO teacher_tasks (id, exam_id, question_id, student_answer_id, teacher_id, student_name, student_id, subject, sub_question_index, sub_question_content, sub_question_answer, sub_question_score, status) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
                  [taskId, examId, answer.question_id, answer.id, teacher.id, answer.student_name, answer.student_id, subject, matchedQuestion.subQuestionIndex, sq.content, sq.answer, sq.score],
                  (err) => {
                    if (err) {
                      console.error('创建批改任务失败:', err);
                    } else {
                      console.log(`创建任务 ${taskId}: 教师 ${teacher.id} 批改学生 ${answer.student_name} 的阅读理解简答题 (题号: ${questionKey})`);
                    }
                  }
                );
              } else {
                // 普通主观题或填空题
                const taskId = uuidv4();
                
                db.run(
                  `INSERT INTO teacher_tasks (id, exam_id, question_id, student_answer_id, teacher_id, student_name, student_id, subject, status) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
                  [taskId, examId, answer.question_id, answer.id, teacher.id, answer.student_name, answer.student_id, subject],
                  (err) => {
                    if (err) {
                      console.error('创建批改任务失败:', err);
                    } else {
                      console.log(`创建任务 ${taskId}: 教师 ${teacher.id} 批改学生 ${answer.student_name} 的题目 ${answer.question_id} (题号: ${questionKey})`);
                    }
                  }
                );
              }
              
              taskIndex++;
            }
          });
          
          console.log(`主观题分配完成，共创建 ${taskIndex} 个批改任务`);
        });
      });
    });
  });
}

// 提交答案（客观题）
app.post('/api/exams/:id/submit-answer', async (req, res) => {
  const examId = req.params.id;
  const { studentName, studentId, className, questionId, answer } = req.body;
  const answerId = uuidv4();

  try {
    // 获取题目信息
    const question = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM questions WHERE id = ?`, [questionId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!question) {
      res.status(404).json({ error: '题目不存在' });
      return;
    }

    let isCorrect = null;
    let score = null;

    // 判断是否需要自动批改
    if (question.type === 'choice' || question.type === 'truefalse') {
      // 选择题和判断题自动批改
      isCorrect = answer === question.answer ? 1 : 0;
      score = isCorrect === 1 ? question.score : 0;
    } else if (question.type === 'reading') {
      // 阅读理解题需要特殊处理
      // 解析子题目答案
      let subQuestions = [];
      if (question.sub_questions) {
        try {
          const parsed = JSON.parse(question.sub_questions);
          if (Array.isArray(parsed)) {
            subQuestions = parsed;
          }
        } catch (e) {
          console.error('解析 sub_questions 失败:', e);
        }
      }
      
      if (subQuestions.length > 0) {
        // 检查是否包含需要人工批改的简答题
        const hasShortAnswer = subQuestions.some(sq => sq.type === 'shortanswer');
        if (!hasShortAnswer) {
          // 全部是选择题，可以自动批改
          // 解析学生答案格式：支持 "第1题：A\n第2题：B" 或 "第1题：A 第2题：B"
          const studentAnswers = {};
          if (answer) {
            // 先尝试按换行分割，如果没有换行则按"第"分割
            let lines = answer.split('\n');
            if (lines.length === 1) {
              // 没有换行，按"第"分割（去掉第一个空字符串）
              lines = answer.split('第').filter(l => l.trim());
              lines = lines.map(l => '第' + l); // 重新加上"第"
            }
            
            lines.forEach(line => {
              const match = line.match(/第(\d+)题[：:]\s*(.+)/);
              if (match) {
                studentAnswers[parseInt(match[1]) - 1] = match[2].trim();
              }
            });
          }
          
          // 计算得分
          let totalScore = 0;
          subQuestions.forEach((sq, idx) => {
            if (sq.type === 'choice' && studentAnswers[idx] === sq.answer) {
              totalScore += sq.score;
            }
          });
          
          // 如果全部答对
          if (totalScore === question.score) {
            isCorrect = 1;
          } else if (totalScore > 0) {
            isCorrect = 0; // 部分正确
          } else {
            isCorrect = 0;
          }
          score = totalScore;
        }
        // 如果有简答题，isCorrect 和 score 保持 null，等待人工批改
      }
    }
    // 填空题和主观题 isCorrect 和 score 保持 null，等待人工批改

    db.run(
      `INSERT INTO student_answers (id, exam_id, student_name, student_id, class_name, question_id, answer, is_correct, score) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [answerId, examId, studentName, studentId, className || '', questionId, answer, isCorrect, score],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ success: true, message: '答案提交成功' });
      }
    );
  } catch (error) {
    console.error('提交答案失败:', error);
    res.status(500).json({ error: '提交答案失败' });
  }
});

// 提交答案（主观题带图片）
app.post('/api/exams/:id/submit-answer-image', upload.single('image'), (req, res) => {
  const examId = req.params.id;
  const { studentName, studentId, questionId, answer } = req.body;
  const imagePath = req.file ? req.file.filename : null;
  const answerId = uuidv4();

  db.run(
    `INSERT INTO student_answers (id, exam_id, student_name, student_id, question_id, answer, image_path) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [answerId, examId, studentName, studentId, questionId, answer || '', imagePath],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, message: '答案提交成功' });
    }
  );
});

// 获取考试结果
app.get('/api/exams/:id/results', (req, res) => {
  const examId = req.params.id;
  
  // 先检查阅卷状态
  db.get(`SELECT grading_status FROM exams WHERE id = ?`, [examId], (err, exam) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!exam) {
      res.status(404).json({ error: '考试不存在' });
      return;
    }
    
    // 如果阅卷未完成，返回提示信息
    if (exam.grading_status !== 'completed') {
      // 获取阅卷进度
      db.all(
        `SELECT status FROM teacher_tasks WHERE exam_id = ?`,
        [examId],
        (err, tasks) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          const total = tasks.length;
          const completed = tasks.filter(t => t.status === 'graded').length;
          
          res.status(403).json({
            error: '阅卷工作正在进行中，请稍后再试',
            gradingStatus: exam.grading_status,
            progress: {
              total,
              completed,
              pending: total - completed
            },
            message: `阅卷进度: ${completed}/${total}，请等待所有教师完成批改后再查看详情`
          });
        }
      );
      return;
    }
    
    // 阅卷已完成，返回结果
    db.all(
      `SELECT sa.*, q.content as question_content, q.answer as correct_answer, q.type, q.score as full_score, q.knowledge_point
       FROM student_answers sa
       JOIN questions q ON sa.question_id = q.id
       WHERE sa.exam_id = ?`,
      [examId],
      (err, rows) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json(rows);
      }
    );
  });
});

// 获取考试统计信息
app.get('/api/exams/:id/statistics', (req, res) => {
  const examId = req.params.id;
  
  // 获取考试基本信息和题目
  db.get(`SELECT * FROM exams WHERE id = ?`, [examId], (err, exam) => {
    if (err || !exam) {
      res.status(500).json({ error: '考试不存在' });
      return;
    }
    
    db.all(`SELECT * FROM questions WHERE exam_id = ?`, [examId], (err, questions) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // 获取所有学生答案
      db.all(
        `SELECT sa.*, q.score as full_score, q.type
         FROM student_answers sa
         JOIN questions q ON sa.question_id = q.id
         WHERE sa.exam_id = ?`,
        [examId],
        (err, answers) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          // 统计学生人数
          const studentSet = new Set(answers.map(a => a.student_id));
          const totalStudents = studentSet.size;
          
          // 按学生统计得分
          const studentScores = {};
          answers.forEach(a => {
            if (!studentScores[a.student_id]) {
              studentScores[a.student_id] = {
                name: a.student_name,
                id: a.student_id,
                className: a.class_name || '未填写',
                totalScore: 0,
                correctCount: 0,
                totalAnswered: 0
              };
            }
            if (a.score !== null) {
              studentScores[a.student_id].totalScore += a.score;
              studentScores[a.student_id].totalAnswered++;
              if (a.is_correct === 1) {
                studentScores[a.student_id].correctCount++;
              }
            }
          });
          
          const scores = Object.values(studentScores);
          const totalScore = scores.reduce((sum, s) => sum + s.totalScore, 0);
          const avgScore = totalStudents > 0 ? (totalScore / totalStudents).toFixed(1) : 0;
          const maxScore = scores.length > 0 ? Math.max(...scores.map(s => s.totalScore)) : 0;
          const minScore = scores.length > 0 ? Math.min(...scores.map(s => s.totalScore)) : 0;
          
          // 按题目统计
          const questionStats = {};
          questions.forEach(q => {
            questionStats[q.id] = {
              questionId: q.id,
              content: q.content,
              type: q.type,
              knowledgePoint: q.knowledge_point,
              fullScore: q.score,
              totalAnswers: 0,
              correctCount: 0,
              correctRate: 0,
              avgScore: 0
            };
          });
          
          answers.forEach(a => {
            if (questionStats[a.question_id]) {
              questionStats[a.question_id].totalAnswers++;
              if (a.is_correct === 1) {
                questionStats[a.question_id].correctCount++;
              }
            }
          });
          
          // 计算正确率
          Object.values(questionStats).forEach(stat => {
            if (stat.totalAnswers > 0) {
              stat.correctRate = ((stat.correctCount / stat.totalAnswers) * 100).toFixed(1);
              stat.avgScore = ((stat.correctCount * stat.fullScore) / stat.totalAnswers).toFixed(1);
            }
          });
          
          // 排名
          const ranking = scores
            .sort((a, b) => b.totalScore - a.totalScore)
            .map((s, index) => ({
              rank: index + 1,
              name: s.name,
              studentId: s.id,
              className: s.className,
              score: s.totalScore,
              correctCount: s.correctCount,
              totalAnswered: s.totalAnswered
            }));
          
          // 按班级分类统计
          const classStats = {};
          scores.forEach(s => {
            const className = s.className || '未填写';
            if (!classStats[className]) {
              classStats[className] = {
                className: className,
                studentCount: 0,
                totalScore: 0,
                avgScore: 0,
                maxScore: 0,
                minScore: 9999,
                students: []
              };
            }
            classStats[className].studentCount++;
            classStats[className].totalScore += s.totalScore;
            classStats[className].students.push({
              name: s.name,
              studentId: s.id,
              score: s.totalScore,
              correctCount: s.correctCount
            });
            if (s.totalScore > classStats[className].maxScore) {
              classStats[className].maxScore = s.totalScore;
            }
            if (s.totalScore < classStats[className].minScore) {
              classStats[className].minScore = s.totalScore;
            }
          });
          
          // 计算班级平均分
          Object.values(classStats).forEach(stat => {
            stat.avgScore = (stat.totalScore / stat.studentCount).toFixed(1);
            // 按分数排序
            stat.students.sort((a, b) => b.score - a.score);
          });
          
          res.json({
            exam,
            totalStudents,
            avgScore,
            maxScore,
            minScore,
            ranking,
            classStats: Object.values(classStats),
            questionStats: Object.values(questionStats),
            totalQuestions: questions.length
          });
        }
      );
    });
  });
});

// 获取需要阅卷的学生列表（有主观题未批改的）
app.get('/api/exams/:id/grading-list', (req, res) => {
  const examId = req.params.id;
  
  // 获取所有参加了考试的学生
  db.all(
    `SELECT DISTINCT student_id, student_name FROM student_answers WHERE exam_id = ?`,
    [examId],
    (err, students) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // 获取每个学生的批改状态
      const studentList = [];
      let processed = 0;
      
      if (students.length === 0) {
        res.json([]);
        return;
      }
      
      students.forEach(student => {
        db.all(
          `SELECT sa.*, q.type, q.score as full_score, q.content, q.answer as correct_answer
           FROM student_answers sa
           JOIN questions q ON sa.question_id = q.id
           WHERE sa.exam_id = ? AND sa.student_id = ? AND q.type != 'choice'`,
          [examId, student.student_id],
          (err, subjectiveAnswers) => {
            if (err) {
              processed++;
              return;
            }
            
            // 统计未批改的主观题
            const ungradedCount = subjectiveAnswers.filter(a => a.score === null).length;
            const totalSubjective = subjectiveAnswers.length;
            
            // 获取已得分
            db.get(
              `SELECT SUM(score) as totalScore FROM student_answers 
               WHERE exam_id = ? AND student_id = ? AND score IS NOT NULL`,
              [examId, student.student_id],
              (err, scoreRow) => {
                processed++;
                
                studentList.push({
                  studentId: student.student_id,
                  studentName: student.student_name,
                  totalScore: scoreRow ? scoreRow.totalScore : 0,
                  ungradedCount: ungradedCount,
                  totalSubjective: totalSubjective,
                  isFullyGraded: ungradedCount === 0
                });
                
                if (processed === students.length) {
                  res.json(studentList.sort((a, b) => b.totalScore - a.totalScore));
                }
              }
            );
          }
        );
      });
    }
  );
});

// 获取某个学生的答题详情（用于阅卷）
app.get('/api/exams/:id/student-answers/:studentId', (req, res) => {
  const examId = req.params.id;
  const studentId = req.params.studentId;
  
  db.all(
    `SELECT sa.*, q.type, q.score as full_score, q.content, q.answer as correct_answer, 
            q.knowledge_point, q.options
     FROM student_answers sa
     JOIN questions q ON sa.question_id = q.id
     WHERE sa.exam_id = ? AND sa.student_id = ?
     ORDER BY q.type = 'choice' DESC, sa.submitted_at ASC`,
    [examId, studentId],
    (err, answers) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // 解析选项
      answers.forEach(a => {
        if (a.options) {
          try {
            a.options = JSON.parse(a.options);
          } catch (e) {
            a.options = [];
          }
        }
      });
      
      res.json(answers);
    }
  );
});

// 教师为主观题打分
app.post('/api/grade-answer', (req, res) => {
  const { answerId, score, teacherComment } = req.body;
  
  if (score === undefined || score === null) {
    res.status(400).json({ error: '请提供分数' });
    return;
  }
  
  db.run(
    `UPDATE student_answers SET score = ?, is_correct = ?, teacher_comment = ? WHERE id = ?`,
    [score, score > 0 ? 1 : 0, teacherComment || '', answerId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({ success: true, message: '评分成功' });
    }
  );
});

// 清除所有数据（只清除考试相关数据，保留试卷库）
app.post('/api/clear-all', (req, res) => {
  db.serialize(() => {
    // 删除学生答案
    db.run(`DELETE FROM student_answers`, (err) => {
      if (err) {
        console.error('删除学生答案失败:', err);
      }
    });
    
    // 删除题目（只删除关联到考试的题目，不删除试卷库的题目）
    db.run(`DELETE FROM questions WHERE exam_id IN (SELECT id FROM exams)`, (err) => {
      if (err) {
        console.error('删除题目失败:', err);
      }
    });
    
    // 删除考试
    db.run(`DELETE FROM exams`, (err) => {
      if (err) {
        console.error('删除考试失败:', err);
        res.status(500).json({ error: '清除数据失败' });
        return;
      }
      
      console.log('考试数据已清除（试卷库保留）');
      res.json({ success: true, message: '考试数据已清除，试卷库保留' });
    });
  });
});

// ===== 试卷收集 API =====

// 获取试卷配置
app.get('/api/paper-config', (req, res) => {
  res.json(paperConfig);
});

// 批量收集试卷
app.post('/api/collect-papers', async (req, res) => {
  const { examTypes, provinces, subjects, years, limitPerSearch } = req.body;
  
  try {
    console.log('开始收集试卷...');
    const papers = await batchSearchPapers({
      examTypes,
      provinces,
      subjects,
      years,
      limitPerSearch
    });
    
    // 保存到数据库
    const savedIds = [];
    for (const paper of papers) {
      try {
        const id = await savePaperToDatabase(db, paper);
        savedIds.push(id);
      } catch (err) {
        console.error('保存试卷失败:', err);
      }
    }
    
    res.json({
      success: true,
      message: `成功收集 ${savedIds.length} 份试卷`,
      collectedCount: savedIds.length,
      papers: papers.map(p => ({
        id: p.id,
        title: p.title,
        examType: p.examType,
        province: p.province,
        subject: p.subject,
        year: p.year,
        questionCount: p.questionCount
      }))
    });
  } catch (error) {
    console.error('收集试卷失败:', error);
    res.status(500).json({ error: '收集试卷失败' });
  }
});

// 获取已收集的试卷列表
app.get('/api/papers', async (req, res) => {
  const { examType, province, subject, year } = req.query;
  
  try {
    const filters = {};
    if (examType) filters.examType = examType;
    if (province) filters.province = province;
    if (subject) filters.subject = subject;
    if (year) filters.year = parseInt(year);
    
    const papers = await getCollectedPapers(db, filters);
    res.json(papers);
  } catch (error) {
    console.error('获取试卷列表失败:', error);
    res.status(500).json({ error: '获取试卷列表失败' });
  }
});

// 获取试卷收集统计
app.get('/api/paper-stats', async (req, res) => {
  try {
    const stats = await getCollectionStats(db);
    res.json(stats);
  } catch (error) {
    console.error('获取统计失败:', error);
    res.status(500).json({ error: '获取统计失败' });
  }
});

// 将试卷导入为考试
app.post('/api/papers/:id/import-to-exam', async (req, res) => {
  const paperId = req.params.id;
  
  try {
    // 获取试卷信息
    const paper = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM papers WHERE id = ?`, [paperId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!paper) {
      res.status(404).json({ error: '试卷不存在' });
      return;
    }
    
    // 获取试卷的题目（从 paper_questions 表）
    const questions = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM paper_questions WHERE paper_id = ? ORDER BY question_order`, [paperId], (err, rows) => {
        if (err) reject(err);
        else {
          // 调试输出
          console.log(`从试卷 ${paperId} 获取到 ${rows.length} 道题目`);
          rows.forEach((q, i) => {
            console.log(`  题目 ${i+1}: type=${q.type}, article=${q.article ? '有' : '无'}, sub_questions=${q.sub_questions ? '有' : '无'}`);
          });
          resolve(rows);
        }
      });
    });
    
    // 创建新考试 - 添加时间戳到名称，避免重名
    const examId = uuidv4();
    const grade = paper.examType === '高考' ? '高中三年级' : '初中三年级';
    const now = new Date();
    const timestamp = `${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const examTitle = `${paper.title} (${timestamp})`;

    db.run(
      `INSERT INTO exams (id, title, subject, grade, difficulty, question_count, time_limit)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [examId, examTitle, paper.subject, grade, 'medium', questions.length, 120],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        // 复制题目到新考试
        if (questions.length === 0) {
          res.json({
            success: true,
            message: '试卷已导入为考试（没有题目）',
            examId: examId
          });
          return;
        }
        
        let completed = 0;
        let hasError = false;
        
        const stmt = db.prepare(`INSERT INTO questions 
          (id, exam_id, type, content, options, answer, explanation, knowledge_point, score, article, sub_questions) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        
        questions.forEach((q, index) => {
          const questionId = uuidv4();
          // 处理 subQuestions 字段名映射（前端用 subQuestions，数据库用 sub_questions）
          const subQuestionsData = q.subQuestions || q.sub_questions;
          
          // 确保 options 是字符串格式
          let optionsStr = q.options;
          if (typeof optionsStr === 'object') {
            optionsStr = JSON.stringify(optionsStr);
          }
          
          stmt.run([
            questionId,
            examId,
            q.type,
            q.content,
            optionsStr,
            q.answer,
            q.explanation,
            q.knowledge_point,
            q.score,
            q.article || null,
            subQuestionsData ? JSON.stringify(subQuestionsData) : null
          ], (err) => {
            if (err) {
              console.error('插入题目失败:', err);
              hasError = true;
            }
            completed++;
            
            if (completed === questions.length) {
              stmt.finalize();
              if (hasError) {
                res.status(500).json({ error: '部分题目导入失败' });
              } else {
                res.json({
                  success: true,
                  message: '试卷已导入为考试',
                  examId: examId
                });
              }
            }
          });
        });
      }
    );
  } catch (error) {
    console.error('导入试卷失败:', error);
    res.status(500).json({ error: '导入试卷失败' });
  }
});

// 删除试卷API
app.delete('/api/papers/:id', async (req, res) => {
  const paperId = req.params.id;
  
  try {
    // 开启事务
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // 先删除关联的题目
      db.run('DELETE FROM paper_questions WHERE paper_id = ?', [paperId], (err) => {
        if (err) {
          console.error('删除题目失败:', err);
          db.run('ROLLBACK');
          res.status(500).json({ error: '删除题目失败' });
          return;
        }
        
        // 再删除试卷
        db.run('DELETE FROM papers WHERE id = ?', [paperId], function(err) {
          if (err) {
            console.error('删除试卷失败:', err);
            db.run('ROLLBACK');
            res.status(500).json({ error: '删除试卷失败' });
            return;
          }
          
          if (this.changes === 0) {
            db.run('ROLLBACK');
            res.status(404).json({ error: '试卷不存在' });
            return;
          }
          
          db.run('COMMIT');
          res.json({ success: true, message: '试卷已删除' });
        });
      });
    });
  } catch (error) {
    console.error('删除试卷失败:', error);
    res.status(500).json({ error: '删除失败: ' + error.message });
  }
});

// 获取试卷详情API
app.get('/api/papers/:id', async (req, res) => {
  const paperId = req.params.id;
  
  try {
    // 获取试卷信息
    const paper = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM papers WHERE id = ?', [paperId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!paper) {
      res.status(404).json({ error: '试卷不存在' });
      return;
    }
    
    // 获取题目列表
    const questions = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM paper_questions WHERE paper_id = ? ORDER BY question_order', [paperId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    // 解析选项JSON和其他字段
    questions.forEach(q => {
      try {
        q.options = JSON.parse(q.options || '[]');
      } catch (e) {
        q.options = [];
      }
      // 解析 sub_questions（映射为前端用的 subQuestions）
      if (q.sub_questions) {
        try {
          q.subQuestions = JSON.parse(q.sub_questions);
        } catch (e) {
          q.subQuestions = [];
        }
      }
    });
    
    res.json({
      ...paper,
      questions
    });
  } catch (error) {
    console.error('获取试卷详情失败:', error);
    res.status(500).json({ error: '获取试卷详情失败' });
  }
});

// 更新试卷API
app.post('/api/papers/:id/update', async (req, res) => {
  const paperId = req.params.id;
  const { paperInfo, questions } = req.body;
  
  if (!paperInfo || !questions) {
    res.status(400).json({ error: '参数不完整' });
    return;
  }
  
  // 调试输出
  console.log('更新试卷，收到题目数量:', questions.length);
  questions.forEach((q, i) => {
    console.log(`题目 ${i+1}: type=${q.type}, article=${q.article ? '有' : '无'}, subQuestions=${q.subQuestions ? '有' : '无'}`);
  });
  
  try {
    const totalScore = questions.reduce((sum, q) => sum + (q.score || 5), 0);
    
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // 更新试卷信息
      db.run(
        `UPDATE papers SET 
         title = ?, exam_type = ?, province = ?, subject = ?, year = ?, 
         grade = ?, exam_time = ?, question_count = ?, total_score = ?
         WHERE id = ?`,
        [
          paperInfo.title,
          paperInfo.examType,
          paperInfo.province,
          paperInfo.subject,
          paperInfo.year,
          paperInfo.grade,
          paperInfo.examTime,
          questions.length,
          totalScore,
          paperId
        ],
        function(err) {
          if (err) {
            console.error('更新试卷失败:', err);
            db.run('ROLLBACK');
            res.status(500).json({ error: '更新试卷失败' });
            return;
          }
          
          // 删除旧题目
          db.run('DELETE FROM paper_questions WHERE paper_id = ?', [paperId], (err) => {
            if (err) {
              console.error('删除旧题目失败:', err);
              db.run('ROLLBACK');
              res.status(500).json({ error: '删除旧题目失败' });
              return;
            }
            
            // 插入新题目
            const stmt = db.prepare(`INSERT INTO paper_questions 
              (id, paper_id, type, content, options, answer, explanation, knowledge_point, score, question_order, article, sub_questions) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            
            let hasError = false;
            questions.forEach((q, index) => {
              const questionId = uuidv4();
              // 处理 subQuestions 字段名映射
              const subQuestionsData = q.subQuestions || q.sub_questions;
              
              stmt.run([
                questionId,
                paperId,
                q.type || 'choice',
                q.content || '',
                JSON.stringify(q.options || []),
                q.answer || '待补充',
                q.explanation || '暂无解析',
                q.knowledgePoint || '综合知识',
                q.score || 5,
                q.question_order || (index + 1),
                q.article || null,
                subQuestionsData ? JSON.stringify(subQuestionsData) : null
              ], (err) => {
                if (err) {
                  console.error(`插入第 ${index + 1} 题失败:`, err);
                  hasError = true;
                }
              });
            });
            
            stmt.finalize();
            
            if (hasError) {
              db.run('ROLLBACK');
              res.status(500).json({ error: '插入题目失败' });
            } else {
              db.run('COMMIT');
              res.json({ success: true, message: '试卷更新成功' });
            }
          });
        }
      );
    });
  } catch (error) {
    console.error('更新试卷失败:', error);
    res.status(500).json({ error: '更新失败: ' + error.message });
  }
});

// 手动添加试卷API
app.post('/api/papers/add', async (req, res) => {
  const { paper, questions } = req.body;
  
  if (!paper || !questions || questions.length === 0) {
    res.status(400).json({ error: '试卷信息和题目不能为空' });
    return;
  }
  
  try {
    const paperId = uuidv4();
    const totalScore = questions.reduce((sum, q) => sum + q.score, 0);
    
    // 开启事务
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // 插入试卷
      db.run(
        `INSERT INTO papers (id, title, exam_type, province, city, subject, year, grade, semester, 
         source, download_url, file_format, question_count, total_score, exam_time, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          paperId,
          paper.title,
          paper.examType,
          paper.province,
          paper.province,
          paper.subject,
          paper.year,
          paper.grade,
          '下学期',
          '手动添加',
          '',
          'PDF',
          questions.length,
          totalScore,
          paper.examTime,
          new Date().toISOString()
        ],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            res.status(500).json({ error: '保存试卷失败: ' + err.message });
            return;
          }
          
          // 插入题目
          const stmt = db.prepare(`INSERT INTO paper_questions 
            (id, paper_id, type, content, options, answer, explanation, knowledge_point, score, question_order, article, sub_questions) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
          
          let hasError = false;
          questions.forEach((q, index) => {
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
              q.question_order || (index + 1),
              q.article || null,
              q.subQuestions ? JSON.stringify(q.subQuestions) : null
            ], (err) => {
              if (err) {
                console.error('插入题目失败:', err);
                hasError = true;
              }
            });
          });
          
          stmt.finalize();
          
          if (hasError) {
            db.run('ROLLBACK');
            res.status(500).json({ error: '保存题目失败' });
          } else {
            db.run('COMMIT');
            res.json({
              success: true,
              message: '试卷添加成功',
              paperId: paperId,
              questionCount: questions.length
            });
          }
        }
      );
    });
  } catch (error) {
    console.error('添加试卷失败:', error);
    res.status(500).json({ error: '添加试卷失败' });
  }
});

// Word文档解析API
app.post('/api/papers/parse-word', uploadMemory.single('wordFile'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: '请上传Word文档' });
      return;
    }
    
    const paperInfo = JSON.parse(req.body.paperInfo || '{}');
    
    // 解析Word文档
    const parseResult = await parseWordDocument(req.file.buffer);
    
    if (!parseResult.success) {
      res.status(500).json(parseResult);
      return;
    }
    
    // 统计题目类型
    const stats = {
      choice: 0,
      fillblank: 0,
      truefalse: 0,
      subjective: 0
    };
    parseResult.questions.forEach(q => {
      if (stats[q.type] !== undefined) {
        stats[q.type]++;
      }
    });
    
    // 生成临时ID
    const tempPaperId = uuidv4();
    
    // 保存到临时存储（可以使用内存或临时文件）
    // 这里直接返回给前端，让前端保存时再提交
    
    res.json({
      success: true,
      paperId: tempPaperId,
      totalCount: parseResult.totalCount,
      questions: parseResult.questions,
      stats: stats,
      message: parseResult.message
    });
    
  } catch (error) {
    console.error('Word解析API错误:', error);
    res.status(500).json({ error: '解析失败: ' + error.message });
  }
});

// 保存解析后的试卷
app.post('/api/papers/save-parsed', async (req, res) => {
  const { paperInfo, questions } = req.body;
  
  if (!questions || questions.length === 0) {
    res.status(400).json({ error: '题目不能为空' });
    return;
  }
  
  if (!paperInfo || !paperInfo.title) {
    res.status(400).json({ error: '试卷信息不完整' });
    return;
  }
  
  try {
    const paperId = uuidv4();
    const totalScore = questions.reduce((sum, q) => sum + (q.score || 5), 0);
    
    // 开启事务
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // 插入试卷
      db.run(
        `INSERT INTO papers (id, title, exam_type, province, city, subject, year, grade, semester, 
         source, download_url, file_format, question_count, total_score, exam_time, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          paperId,
          paperInfo.title,
          paperInfo.examType || '期末联考',
          paperInfo.province || '未知',
          paperInfo.province || '未知',
          paperInfo.subject || '数学',
          paperInfo.year || 2024,
          paperInfo.grade || '高一',
          '下学期',
          'Word导入',
          '',
          'DOCX',
          questions.length,
          totalScore,
          paperInfo.examTime || 120,
          new Date().toISOString()
        ],
        function(err) {
          if (err) {
            console.error('插入试卷失败:', err);
            db.run('ROLLBACK');
            res.status(500).json({ error: '保存试卷失败: ' + err.message });
            return;
          }
          
          // 插入题目
          const stmt = db.prepare(`INSERT INTO paper_questions 
            (id, paper_id, type, content, options, answer, explanation, knowledge_point, score, question_order) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
          
          let hasError = false;
          questions.forEach((q, index) => {
            const questionId = uuidv4();
            stmt.run([
              questionId,
              paperId,
              q.type || 'choice',
              q.content || '',
              JSON.stringify(q.options || []),
              q.answer || '待补充',
              q.explanation || '暂无解析',
              q.knowledgePoint || '综合知识',
              q.score || 5,
              q.question_order || (index + 1)
            ], (err) => {
              if (err) {
                console.error(`插入第 ${index + 1} 题失败:`, err);
                hasError = true;
              }
            });
          });
          
          stmt.finalize();
          
          if (hasError) {
            db.run('ROLLBACK');
            res.status(500).json({ error: '保存题目失败' });
          } else {
            db.run('COMMIT');
            res.json({
              success: true,
              message: '试卷保存成功',
              paperId: paperId,
              questionCount: questions.length
            });
          }
        }
      );
    });
  } catch (error) {
    console.error('保存试卷失败:', error);
    res.status(500).json({ error: '保存失败: ' + error.message });
  }
});

// ===== 教师注册登录 API =====

// 教师注册
app.post('/api/teacher/register', async (req, res) => {
  const { username, password, name, subject, classes } = req.body;

  if (!username || !password || !name || !subject || !classes) {
    res.status(400).json({ error: '请填写所有必填项' });
    return;
  }

  try {
    const teacherId = uuidv4();
    const classesStr = Array.isArray(classes) ? JSON.stringify(classes) : classes;

    db.run(
      `INSERT INTO teachers (id, username, password, name, subject, classes) VALUES (?, ?, ?, ?, ?, ?)`,
      [teacherId, username, password, name, subject, classesStr],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            res.status(400).json({ error: '用户名已存在' });
          } else {
            res.status(500).json({ error: '注册失败: ' + err.message });
          }
          return;
        }
        res.json({ success: true, message: '注册成功', teacherId });
      }
    );
  } catch (error) {
    console.error('教师注册失败:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

// 教师登录
app.post('/api/teacher/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: '请输入用户名和密码' });
    return;
  }

  db.get(
    `SELECT id, username, name, subject, classes FROM teachers WHERE username = ? AND password = ?`,
    [username, password],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: '登录失败' });
        return;
      }
      if (!row) {
        res.status(401).json({ error: '用户名或密码错误' });
        return;
      }
      res.json({ success: true, teacher: row });
    }
  );
});

// 获取教师列表（用于管理）
app.get('/api/teachers', (req, res) => {
  db.all(`SELECT id, username, name, subject, created_at FROM teachers ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: '获取教师列表失败' });
      return;
    }
    res.json({ teachers: rows });
  });
});

// 获取教师的待批改任务
app.get('/api/teacher/:id/tasks', (req, res) => {
  const teacherId = req.params.id;
  const status = req.query.status || 'pending';
  
  db.all(
    `SELECT t.*, q.content as question_content, q.type as question_type, q.score as full_score, q.article, q.sub_questions, sa.answer as student_answer, e.title as exam_title
     FROM teacher_tasks t
     JOIN questions q ON t.question_id = q.id
     JOIN student_answers sa ON t.student_answer_id = sa.id
     JOIN exams e ON t.exam_id = e.id
     WHERE t.teacher_id = ? AND t.status = ?
     ORDER BY t.created_at DESC`,
    [teacherId, status],
    (err, rows) => {
      if (err) {
        console.error('获取教师任务失败:', err);
        res.status(500).json({ error: '获取任务失败' });
        return;
      }
      
      // 解析题目数据
      rows.forEach(row => {
        if (row.sub_questions) {
          try {
            let parsed = JSON.parse(row.sub_questions);
            if (typeof parsed === 'string') {
              parsed = JSON.parse(parsed);
            }
            row.subQuestions = parsed;
          } catch (e) {
            row.subQuestions = [];
          }
        }
      });
      
      res.json({ tasks: rows });
    }
  );
});

// 教师提交批改结果
app.post('/api/teacher/task/:id/grade', (req, res) => {
  const taskId = req.params.id;
  const { score, comment } = req.body;
  
  if (score === undefined || score === null) {
    res.status(400).json({ error: '请输入分数' });
    return;
  }
  
  db.get(`SELECT * FROM teacher_tasks WHERE id = ?`, [taskId], (err, task) => {
    if (err || !task) {
      res.status(500).json({ error: '任务不存在' });
      return;
    }
    
    db.run(
      `UPDATE teacher_tasks SET status = 'graded', assigned_score = ?, teacher_comment = ?, graded_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [score, comment || '', taskId],
      function(err) {
        if (err) {
          console.error('更新批改结果失败:', err);
          res.status(500).json({ error: '提交失败' });
          return;
        }
        
        // 如果是阅读理解题的简答题，需要累加分数
        if (task.sub_question_index >= 0) {
          // 获取学生当前的分数
          db.get(`SELECT score FROM student_answers WHERE id = ?`, [task.student_answer_id], (err, answerRow) => {
            if (!err && answerRow) {
              // 累加分数（选择题分数 + 简答题分数）
              const newTotalScore = (answerRow.score || 0) + score;
              db.run(
                `UPDATE student_answers SET score = ? WHERE id = ?`,
                [newTotalScore, task.student_answer_id]
              );
              console.log(`更新学生答案 ${task.student_answer_id} 的分数: ${newTotalScore}`);
            }
          });
        } else {
          // 普通主观题，直接更新分数
          db.run(
            `UPDATE student_answers SET score = ?, is_correct = ? WHERE id = ?`,
            [score, score > 0 ? 1 : 0, task.student_answer_id]
          );
        }
        
        // 检查该考试的所有批改任务是否都已完成
        checkAndUpdateGradingStatus(task.exam_id);
        
        res.json({ success: true, message: '批改完成' });
      }
    );
  });
});

// 获取教师的批改统计
app.get('/api/teacher/:id/stats', (req, res) => {
  const teacherId = req.params.id;
  
  db.get(
    `SELECT 
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
      COUNT(CASE WHEN status = 'graded' THEN 1 END) as graded_count,
      COUNT(*) as total_count
     FROM teacher_tasks WHERE teacher_id = ?`,
    [teacherId],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: '获取统计失败' });
        return;
      }
      res.json({ stats: row });
    }
  );
});

// 检查并更新阅卷状态
function checkAndUpdateGradingStatus(examId) {
  console.log(`检查考试 ${examId} 的阅卷状态`);
  
  // 获取该考试的所有批改任务
  db.all(
    `SELECT status FROM teacher_tasks WHERE exam_id = ?`,
    [examId],
    (err, tasks) => {
      if (err) {
        console.error('获取批改任务失败:', err);
        return;
      }
      
      if (tasks.length === 0) {
        console.log(`考试 ${examId} 没有需要批改的任务`);
        // 没有主观题需要批改，直接标记为完成
        db.run(`UPDATE exams SET grading_status = 'completed' WHERE id = ?`, [examId]);
        return;
      }
      
      // 检查是否所有任务都已完成
      const allGraded = tasks.every(t => t.status === 'graded');
      const pendingCount = tasks.filter(t => t.status === 'pending').length;
      
      console.log(`考试 ${examId} 阅卷进度: ${tasks.length - pendingCount}/${tasks.length}`);
      
      if (allGraded) {
        console.log(`考试 ${examId} 所有主观题批改完成！`);
        db.run(
          `UPDATE exams SET grading_status = 'completed' WHERE id = ?`,
          [examId],
          (err) => {
            if (err) {
              console.error('更新阅卷状态失败:', err);
            } else {
              console.log(`考试 ${examId} 阅卷状态已更新为 completed`);
            }
          }
        );
      } else {
        // 更新为阅卷中状态
        db.run(
          `UPDATE exams SET grading_status = 'grading' WHERE id = ? AND grading_status = 'pending'`,
          [examId]
        );
      }
    }
  );
}

// 获取考试阅卷进度
app.get('/api/exams/:id/grading-progress', (req, res) => {
  const examId = req.params.id;
  
  db.all(
    `SELECT status FROM teacher_tasks WHERE exam_id = ?`,
    [examId],
    (err, tasks) => {
      if (err) {
        res.status(500).json({ error: '获取进度失败' });
        return;
      }
      
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'graded').length;
      const pending = total - completed;
      
      res.json({
        total,
        completed,
        pending,
        isComplete: total > 0 && pending === 0
      });
    }
  );
});

// ===== Socket.io 连接处理 =====
io.on('connection', (socket) => {
  console.log('客户端已连接:', socket.id);

  socket.on('join-exam', (data) => {
    socket.join(data.examId);
    console.log(`学生 ${data.studentName} 加入考试 ${data.examId}`);
  });

  socket.on('disconnect', () => {
    console.log('客户端已断开:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`本地访问: http://localhost:${PORT}`);
  console.log(`局域网访问: http://0.0.0.0:${PORT}`);
});
