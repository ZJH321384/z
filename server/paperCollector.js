// 试卷收集器 - 搜索和下载各省份各科真题试卷
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// 尝试导入爬虫模块，如果不存在则使用模拟数据
let crawlerModule = null;
try {
  crawlerModule = require('./crawler');
} catch (e) {
  console.log('爬虫模块未找到，将使用模拟数据');
}

// 试卷配置
const paperConfig = {
  provinces: [
    '全国卷I', '全国卷II', '全国卷III', '新高考I卷', '新高考II卷',
    '北京', '上海', '天津', '重庆',
    '江苏', '浙江', '山东', '广东', '福建', '海南',
    '湖南', '湖北', '河南', '河北', '山西', '江西', '安徽',
    '四川', '贵州', '云南', '陕西', '甘肃', '青海', '宁夏',
    '辽宁', '吉林', '黑龙江', '内蒙古', '新疆', '西藏', '广西'
  ],
  subjects: ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'],
  examTypes: ['高考', '中考'],
  years: [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015]
};

// 搜索关键词生成器
function generateSearchKeywords(examType, province, subject, year) {
  const keywords = [];
  
  // 基础关键词组合
  keywords.push(`${year}年${province}${examType}${subject}真题`);
  keywords.push(`${year} ${province} ${subject} ${examType} 试卷`);
  keywords.push(`${province}${year}年${subject}${examType}试题`);
  
  // 带答案的关键词
  keywords.push(`${year}年${province}${examType}${subject}真题及答案`);
  keywords.push(`${year} ${province} ${subject} ${examType} 答案解析`);
  
  // PDF格式关键词
  keywords.push(`${year}年${province}${examType}${subject}真题 PDF`);
  keywords.push(`${year} ${province} ${subject} ${examType} PDF下载`);
  
  return keywords;
}

// 教育资源网站列表
const eduWebsites = [
  { name: '学科网', domain: 'zxxk.com', searchPath: '/search' },
  { name: '菁优网', domain: 'jyeoo.com', searchPath: '/search' },
  { name: '高考资源网', domain: 'ks5u.com', searchPath: '/search' },
  { name: '中考网', domain: 'zhongkao.com', searchPath: '/search' },
  { name: '第一试卷网', domain: 'shijuan1.com', searchPath: '/search' },
  { name: '教习网', domain: '51jiaoxi.com', searchPath: '/search' },
  { name: '百度文库', domain: 'wenku.baidu.com', searchPath: '/search' },
  { name: '道客巴巴', domain: 'doc88.com', searchPath: '/search' }
];

// 模拟试卷数据（用于演示，实际应该通过爬虫获取）
function generateMockPaper(examType, province, subject, year) {
  const paperId = uuidv4();
  const questionCount = examType === '高考' ? 20 : 15;
  const questions = [];
  
  const types = ['choice', 'fillblank', 'truefalse'];
  const typeNames = { choice: '选择题', fillblank: '填空题', truefalse: '判断题' };
  
  for (let i = 0; i < questionCount; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const questionId = uuidv4();
    
    let question = {
      id: questionId,
      type: type,
      content: `${year}年${province}${examType}${subject}第${i + 1}题示例题目`,
      answer: '',
      explanation: `本题考查${subject}知识点，答案解析...`,
      knowledgePoint: `${subject}基础知识`,
      score: type === 'choice' ? 5 : type === 'fillblank' ? 4 : 3,
      difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)]
    };
    
    if (type === 'choice') {
      question.options = ['A. 选项1', 'B. 选项2', 'C. 选项3', 'D. 选项4'];
      question.answer = ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)];
    } else if (type === 'truefalse') {
      question.options = ['正确', '错误'];
      question.answer = Math.random() > 0.5 ? '正确' : '错误';
    } else {
      question.answer = '答案';
    }
    
    questions.push(question);
  }
  
  return {
    id: paperId,
    title: `${year}年${province}${examType}${subject}真题`,
    examType: examType,
    province: province,
    subject: subject,
    year: year,
    source: '模拟数据源',
    downloadUrl: '',
    fileFormat: 'PDF',
    questionCount: questionCount,
    totalScore: questions.reduce((sum, q) => sum + q.score, 0),
    questions: questions,
    createdAt: new Date().toISOString()
  };
}

// 搜索试卷（使用爬虫）
async function searchPapers(examType, province, subject, year, limit = 5) {
  console.log(`搜索试卷: ${year}年 ${province} ${examType} ${subject}`);
  
  // 如果有爬虫模块，尝试使用爬虫
  if (crawlerModule && crawlerModule.searchPapersWithCrawler) {
    try {
      const searchResults = await crawlerModule.searchPapersWithCrawler(examType, province, subject, year, {
        engines: ['baidu', 'bing'],
        maxResults: limit,
        timeout: 30000
      });
      
      if (searchResults.length > 0) {
        // 将搜索结果转换为试卷格式
        const papers = searchResults.map((result, index) => {
          const paperId = uuidv4();
          return {
            id: paperId,
            title: result.title || `${year}年${province}${examType}${subject}真题`,
            examType: examType,
            province: province,
            subject: subject,
            year: year,
            source: result.source || '网络爬虫',
            downloadUrl: result.url,
            fileFormat: result.url.includes('.pdf') ? 'PDF' : 
                       result.url.includes('.docx') ? 'DOCX' : 
                       result.url.includes('.doc') ? 'DOC' : 'UNKNOWN',
            questionCount: examType === '高考' ? 20 : 15,
            totalScore: examType === '高考' ? 150 : 100,
            questions: [], // 题目需要在下载后解析
            createdAt: new Date().toISOString(),
            searchScore: result.score,
            abstract: result.abstract
          };
        });
        
        return papers;
      }
    } catch (error) {
      console.error('爬虫搜索失败，使用模拟数据:', error);
    }
  }
  
  // 使用模拟数据
  console.log('使用模拟数据生成试卷');
  const papers = [];
  const count = Math.min(limit, 3);
  for (let i = 0; i < count; i++) {
    const paper = generateMockPaper(examType, province, subject, year);
    paper.title = `${year}年${province}${examType}${subject}真题（${['A', 'B', 'C'][i]}卷）`;
    papers.push(paper);
  }
  return papers;
}

// 批量搜索试卷
async function batchSearchPapers(options) {
  const {
    examTypes = ['高考'],
    provinces = ['全国卷I'],
    subjects = ['数学'],
    years = [2024],
    limitPerSearch = 2
  } = options;
  
  const allPapers = [];
  
  for (const examType of examTypes) {
    for (const province of provinces) {
      for (const subject of subjects) {
        for (const year of years) {
          try {
            const papers = await searchPapers(examType, province, subject, year, limitPerSearch);
            allPapers.push(...papers);
          } catch (error) {
            console.error(`搜索失败: ${year} ${province} ${examType} ${subject}`, error);
          }
        }
      }
    }
  }
  
  return allPapers;
}

// 保存试卷到数据库
async function savePaperToDatabase(db, paper) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO papers (id, title, exam_type, province, subject, year, source, download_url, file_format, question_count, total_score, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paper.id,
        paper.title,
        paper.examType,
        paper.province,
        paper.subject,
        paper.year,
        paper.source,
        paper.downloadUrl,
        paper.fileFormat,
        paper.questionCount,
        paper.totalScore,
        paper.createdAt
      ],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        // 保存题目
        const stmt = db.prepare(`INSERT INTO questions 
          (id, exam_id, type, content, options, answer, explanation, knowledge_point, score, difficulty) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        
        paper.questions.forEach(q => {
          stmt.run([
            q.id,
            paper.id,
            q.type,
            q.content,
            JSON.stringify(q.options || []),
            q.answer,
            q.explanation,
            q.knowledgePoint,
            q.score,
            q.difficulty
          ]);
        });
        
        stmt.finalize();
        resolve(paper.id);
      }
    );
  });
}

// 获取已收集的试卷列表
async function getCollectedPapers(db, filters = {}) {
  return new Promise((resolve, reject) => {
    let sql = `SELECT * FROM papers WHERE 1=1`;
    const params = [];
    
    if (filters.examType) {
      sql += ` AND exam_type = ?`;
      params.push(filters.examType);
    }
    if (filters.province) {
      sql += ` AND province = ?`;
      params.push(filters.province);
    }
    if (filters.subject) {
      sql += ` AND subject = ?`;
      params.push(filters.subject);
    }
    if (filters.year) {
      sql += ` AND year = ?`;
      params.push(filters.year);
    }
    
    sql += ` ORDER BY year DESC, created_at DESC`;
    
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

// 统计试卷收集情况
async function getCollectionStats(db) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT 
      COUNT(*) as totalPapers,
      COUNT(DISTINCT province) as provinceCount,
      COUNT(DISTINCT subject) as subjectCount,
      COUNT(DISTINCT year) as yearCount
    FROM papers`, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      // 按科目统计
      db.all(`SELECT subject, COUNT(*) as count FROM papers GROUP BY subject ORDER BY count DESC`, (err, subjectStats) => {
        if (err) {
          reject(err);
          return;
        }
        
        // 按年份统计
        db.all(`SELECT year, COUNT(*) as count FROM papers GROUP BY year ORDER BY year DESC`, (err, yearStats) => {
          if (err) {
            reject(err);
            return;
          }
          
          resolve({
            ...row,
            subjectStats,
            yearStats
          });
        });
      });
    });
  });
}

// 下载试卷文件
async function downloadPaperFile(paper, downloadDir = './downloads') {
  try {
    // 确保下载目录存在
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    
    // 生成文件名
    const fileName = `${paper.title.replace(/[^\w\u4e00-\u9fa5]/g, '_')}.${paper.fileFormat.toLowerCase()}`;
    const savePath = path.join(downloadDir, fileName);
    
    // 检查文件是否已存在
    if (fs.existsSync(savePath)) {
      console.log(`文件已存在: ${savePath}`);
      return {
        success: true,
        filePath: savePath,
        alreadyExists: true
      };
    }
    
    // 下载文件
    console.log(`开始下载: ${paper.title}`);
    const downloadResult = await downloadFile(paper.downloadUrl, savePath, {
      onProgress: (progress) => {
        console.log(`  下载进度: ${progress}%`);
      }
    });
    
    return {
      success: true,
      filePath: savePath,
      fileSize: downloadResult.size,
      alreadyExists: false
    };
  } catch (error) {
    console.error(`下载失败 ${paper.title}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// 批量下载试卷
async function batchDownloadPapersToDir(papers, downloadDir = './downloads') {
  const results = [];
  
  for (let i = 0; i < papers.length; i++) {
    const paper = papers[i];
    console.log(`下载试卷 ${i + 1}/${papers.length}: ${paper.title}`);
    
    const result = await downloadPaperFile(paper, downloadDir);
    results.push({
      ...paper,
      ...result
    });
    
    // 延迟避免被封
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  }
  
  return results;
}

module.exports = {
  paperConfig,
  generateSearchKeywords,
  searchPapers,
  batchSearchPapers,
  savePaperToDatabase,
  getCollectedPapers,
  getCollectionStats,
  downloadPaperFile,
  batchDownloadPapersToDir
};
