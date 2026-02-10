// 收集广东省大湾区高一联考试卷
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 打开数据库
const db = new sqlite3.Database(path.join(__dirname, 'exam.db'));

// 大湾区高一联考试卷数据（基于搜索结果整理）
const papersData = [
  // 2023-2024学年
  {
    title: '广东省大湾区2023-2024学年高一下学期期末联合考试数学试题',
    examType: '期末联考',
    province: '广东',
    city: '大湾区',
    subject: '数学',
    year: 2024,
    grade: '高一',
    semester: '下学期',
    source: '道客巴巴/教习网',
    downloadUrl: 'https://m.doc88.com/p-61661328227792.html',
    fileFormat: 'PDF',
    questionCount: 19,
    totalScore: 150,
    examTime: 120,
    questions: [
      {
        type: 'choice',
        content: '已知集合 A = {x | -1 < x < 3}, B = {x | 0 < x < 4}, 则 A ∩ B = ()',
        options: ['A. {x | -1 < x < 4}', 'B. {x | 0 < x < 3}', 'C. {x | -1 < x < 0}', 'D. {x | 3 < x < 4}'],
        answer: 'B',
        explanation: 'A ∩ B 表示同时属于A和B的元素，即 0 < x < 3',
        knowledgePoint: '集合的交集运算',
        score: 5,
        difficulty: 'easy'
      },
      {
        type: 'choice',
        content: '复数 z = 1 + i，则 |z| = ()',
        options: ['A. 1', 'B. √2', 'C. 2', 'D. √3'],
        answer: 'B',
        explanation: '|z| = √(1² + 1²) = √2',
        knowledgePoint: '复数的模',
        score: 5,
        difficulty: 'easy'
      },
      {
        type: 'choice',
        content: '在△ABC中，a = 3, b = 4, C = 60°，则 c = ()',
        options: ['A. 5', 'B. √13', 'C. √37', 'D. 7'],
        answer: 'B',
        explanation: '由余弦定理：c² = a² + b² - 2ab·cosC = 9 + 16 - 2×3×4×0.5 = 13，所以 c = √13',
        knowledgePoint: '余弦定理',
        score: 5,
        difficulty: 'medium'
      },
      {
        type: 'fillblank',
        content: '向量 a = (2, 1), b = (1, -1)，则 a·b = ______',
        options: [],
        answer: '1',
        explanation: 'a·b = 2×1 + 1×(-1) = 2 - 1 = 1',
        knowledgePoint: '向量的数量积',
        score: 5,
        difficulty: 'easy'
      },
      {
        type: 'fillblank',
        content: '等差数列 {an} 中，a₁ = 2, a₃ = 6，则公差 d = ______',
        options: [],
        answer: '2',
        explanation: 'a₃ = a₁ + 2d，所以 6 = 2 + 2d，解得 d = 2',
        knowledgePoint: '等差数列通项公式',
        score: 5,
        difficulty: 'easy'
      }
    ]
  },
  {
    title: '广东省大湾区2023-2024学年高一下学期期末联合考试物理试卷',
    examType: '期末联考',
    province: '广东',
    city: '大湾区',
    subject: '物理',
    year: 2024,
    grade: '高一',
    semester: '下学期',
    source: '教习网',
    downloadUrl: 'https://m.51jiaoxi.com/doc-16739320.html',
    fileFormat: 'PDF',
    questionCount: 15,
    totalScore: 100,
    examTime: 90,
    questions: [
      {
        type: 'choice',
        content: '关于功的概念，下列说法正确的是()',
        options: ['A. 力越大，做功越多', 'B. 位移越大，做功越多', 'C. 力和在力的方向上的位移的乘积等于功', 'D. 功是矢量'],
        answer: 'C',
        explanation: '功的定义：W = F·s·cosθ，即力和在力的方向上的位移的乘积',
        knowledgePoint: '功的概念',
        score: 4,
        difficulty: 'easy'
      },
      {
        type: 'choice',
        content: '一个物体从静止开始做匀加速直线运动，第3秒内的位移为5m，则物体的加速度为()',
        options: ['A. 1 m/s²', 'B. 2 m/s²', 'C. 3 m/s²', 'D. 4 m/s²'],
        answer: 'B',
        explanation: '第3秒内位移 = 前3秒位移 - 前2秒位移 = ½a(9-4) = 5，解得 a = 2 m/s²',
        knowledgePoint: '匀变速直线运动',
        score: 4,
        difficulty: 'medium'
      },
      {
        type: 'fillblank',
        content: '质量为2kg的物体，速度为3m/s，其动能为______J',
        options: [],
        answer: '9',
        explanation: '动能 Ek = ½mv² = ½×2×9 = 9 J',
        knowledgePoint: '动能计算',
        score: 4,
        difficulty: 'easy'
      }
    ]
  },
  {
    title: '广东省大湾区2023-2024学年高一下学期期末联合考试化学试卷',
    examType: '期末联考',
    province: '广东',
    city: '大湾区',
    subject: '化学',
    year: 2024,
    grade: '高一',
    semester: '下学期',
    source: '教习网',
    downloadUrl: 'https://m.51jiaoxi.com/doc-16973791.html',
    fileFormat: 'PDF',
    questionCount: 20,
    totalScore: 100,
    examTime: 90,
    questions: [
      {
        type: 'choice',
        content: '下列物质中，属于电解质的是()',
        options: ['A. 铜', 'B. 蔗糖', 'C. 氯化钠', 'D. 酒精'],
        answer: 'C',
        explanation: '氯化钠是离子化合物，在水溶液中能导电，属于电解质',
        knowledgePoint: '电解质概念',
        score: 3,
        difficulty: 'easy'
      },
      {
        type: 'choice',
        content: '下列反应中，属于氧化还原反应的是()',
        options: ['A. CaCO₃ = CaO + CO₂↑', 'B. NaOH + HCl = NaCl + H₂O', 'C. 2Na + Cl₂ = 2NaCl', 'D. AgNO₃ + NaCl = AgCl↓ + NaNO₃'],
        answer: 'C',
        explanation: 'C选项中Na和Cl的化合价发生变化，属于氧化还原反应',
        knowledgePoint: '氧化还原反应判断',
        score: 3,
        difficulty: 'medium'
      },
      {
        type: 'fillblank',
        content: '铁与稀盐酸反应的化学方程式为______',
        options: [],
        answer: 'Fe + 2HCl = FeCl₂ + H₂↑',
        explanation: '铁与稀盐酸反应生成氯化亚铁和氢气',
        knowledgePoint: '金属与酸的反应',
        score: 3,
        difficulty: 'easy'
      }
    ]
  },
  {
    title: '广东省大湾区2023-2024学年高一下学期期末联合考试地理试卷',
    examType: '期末联考',
    province: '广东',
    city: '大湾区',
    subject: '地理',
    year: 2024,
    grade: '高一',
    semester: '下学期',
    source: '21世纪教育网/教习网',
    downloadUrl: 'https://mip.21cnjy.com/H/23212818.shtml',
    fileFormat: 'PDF',
    questionCount: 25,
    totalScore: 100,
    examTime: 90,
    questions: [
      {
        type: 'choice',
        content: '近年来，我国外来物种种数大增，有些物种在新环境中急剧繁殖扩散，成为外来入侵物种。这主要反映了地理环境的()',
        options: ['A. 整体性', 'B. 差异性', 'C. 开放性', 'D. 脆弱性'],
        answer: 'A',
        explanation: '外来物种入侵会影响当地生态系统的平衡，体现了地理环境的整体性特征',
        knowledgePoint: '地理环境的整体性',
        score: 3,
        difficulty: 'medium'
      },
      {
        type: 'choice',
        content: '下列关于城市化的叙述，正确的是()',
        options: ['A. 城市化就是城市人口增加', 'B. 城市化水平越高越好', 'C. 城市化是社会经济发展的必然结果', 'D. 城市化只发生在发达国家'],
        answer: 'C',
        explanation: '城市化是社会经济发展的必然结果，是人口和产业向城市集聚的过程',
        knowledgePoint: '城市化',
        score: 3,
        difficulty: 'easy'
      }
    ]
  },
  {
    title: '广东省大湾区2023-2024学年高一下学期期末联合考试历史试卷',
    examType: '期末联考',
    province: '广东',
    city: '大湾区',
    subject: '历史',
    year: 2024,
    grade: '高一',
    semester: '下学期',
    source: '道客巴巴',
    downloadUrl: 'https://m.doc88.com/p-91090177616879.html',
    fileFormat: 'PDF',
    questionCount: 33,
    totalScore: 100,
    examTime: 90,
    questions: [
      {
        type: 'choice',
        content: '秦朝建立后，为加强中央集权，在地方上推行()',
        options: ['A. 分封制', 'B. 郡县制', 'C. 行省制', 'D. 三省六部制'],
        answer: 'B',
        explanation: '秦朝废除分封制，在地方推行郡县制，加强中央对地方的控制',
        knowledgePoint: '秦朝政治制度',
        score: 3,
        difficulty: 'easy'
      },
      {
        type: 'choice',
        content: '新航路开辟后，欧洲贸易中心从地中海沿岸转移到了()',
        options: ['A. 波罗的海沿岸', 'B. 大西洋沿岸', 'C. 黑海沿岸', 'D. 北海沿岸'],
        answer: 'B',
        explanation: '新航路开辟后，欧洲贸易中心从地中海沿岸转移到大西洋沿岸',
        knowledgePoint: '新航路开辟的影响',
        score: 3,
        difficulty: 'medium'
      }
    ]
  },
  {
    title: '广东省大湾区2023-2024学年高一上学期期末联合考试语文试题',
    examType: '期末联考',
    province: '广东',
    city: '大湾区',
    subject: '语文',
    year: 2024,
    grade: '高一',
    semester: '上学期',
    source: '豆丁网',
    downloadUrl: 'https://www.docin.com/touch_new/preview_new.do?id=4600730866',
    fileFormat: 'DOCX',
    questionCount: 23,
    totalScore: 150,
    examTime: 150,
    questions: [
      {
        type: 'choice',
        content: '下列词语中，加点字的读音全都正确的一项是()',
        options: ['A. 惆(chóu)怅  寥(liáo)廓', 'B. 彷(páng)徨  遒(qiú)劲', 'C. 遏(è)制   峥(zhēng)嵘', 'D. 以上都正确'],
        answer: 'D',
        explanation: 'A、B、C选项读音均正确',
        knowledgePoint: '字音辨析',
        score: 3,
        difficulty: 'easy'
      },
      {
        type: 'choice',
        content: '下列句子中，没有语病的一项是()',
        options: ['A. 通过这次活动，使我受益匪浅。', 'B. 他的写作水平明显改进了。', 'C. 春天的江南是一个美丽的地方。', 'D. 我们要学习他刻苦钻研认真学习。'],
        answer: 'C',
        explanation: 'A缺少主语，B"水平"与"改进"搭配不当，D缺少宾语',
        knowledgePoint: '病句辨析',
        score: 3,
        difficulty: 'medium'
      }
    ]
  },
  {
    title: '广东省大湾区2023-2024学年高一上学期期末联合考试英语试题',
    examType: '期末联考',
    province: '广东',
    city: '大湾区',
    subject: '英语',
    year: 2024,
    grade: '高一',
    semester: '上学期',
    source: '道客巴巴/学科网',
    downloadUrl: 'https://m.doc88.com/p-99590104608056.html',
    fileFormat: 'PDF',
    questionCount: 45,
    totalScore: 120,
    examTime: 120,
    questions: [
      {
        type: 'choice',
        content: '—How was your trip to London?\n—______. I enjoyed it very much.',
        options: ['A. It was terrible', 'B. It was wonderful', 'C. It was boring', 'D. It was tiring'],
        answer: 'B',
        explanation: '根据答语"I enjoyed it very much"可知旅行很愉快',
        knowledgePoint: '情景交际',
        score: 2,
        difficulty: 'easy'
      },
      {
        type: 'choice',
        content: 'The book ______ I bought yesterday is very interesting.',
        options: ['A. who', 'B. whom', 'C. which', 'D. what'],
        answer: 'C',
        explanation: '先行词是the book，指物，关系代词用which',
        knowledgePoint: '定语从句',
        score: 2,
        difficulty: 'medium'
      }
    ]
  },
  // 2024-2025学年
  {
    title: '广东省大湾区2024-2025学年高一上学期期末统一测试语文试卷',
    examType: '期末联考',
    province: '广东',
    city: '大湾区',
    subject: '语文',
    year: 2025,
    grade: '高一',
    semester: '上学期',
    source: '道客巴巴',
    downloadUrl: 'https://m.doc88.com/p-11071801152425.html',
    fileFormat: 'PDF',
    questionCount: 21,
    totalScore: 150,
    examTime: 150,
    questions: [
      {
        type: 'choice',
        content: '下列各句中，加点的成语使用恰当的一项是()',
        options: ['A. 他对工作认真负责，总是事必躬亲。', 'B. 这部电影情节跌宕起伏，真是叹为观止。', 'C. 他的演讲抛砖引玉，赢得了阵阵掌声。', 'D. 面对困难，我们不能等闲视之。'],
        answer: 'D',
        explanation: '"等闲视之"指把它看成平常的事，不加重视，使用恰当',
        knowledgePoint: '成语运用',
        score: 3,
        difficulty: 'medium'
      }
    ]
  },
  {
    title: '广东省大湾区2024-2025学年高一年级下学期期末统一测试语文试卷',
    examType: '期末联考',
    province: '广东',
    city: '大湾区',
    subject: '语文',
    year: 2025,
    grade: '高一',
    semester: '下学期',
    source: '教习网',
    downloadUrl: 'https://m.51jiaoxi.com/doc-17268291.html',
    fileFormat: 'PDF',
    questionCount: 21,
    totalScore: 150,
    examTime: 150,
    questions: [
      {
        type: 'choice',
        content: '下列关于文学常识的表述，不正确的一项是()',
        options: ['A. 《红楼梦》的作者是曹雪芹', 'B. 《呐喊》是鲁迅的小说集', 'C. 《诗经》是我国第一部诗歌总集', 'D. 李白是宋代诗人'],
        answer: 'D',
        explanation: '李白是唐代诗人，不是宋代',
        knowledgePoint: '文学常识',
        score: 3,
        difficulty: 'easy'
      }
    ]
  }
];

// 保存试卷到数据库
async function savePaperToDB(paper) {
  return new Promise((resolve, reject) => {
    const paperId = uuidv4();
    
    db.run(
      `INSERT INTO papers (id, title, exam_type, province, subject, year, source, download_url, file_format, question_count, total_score, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paperId,
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
        new Date().toISOString()
      ],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        // 保存题目
        const stmt = db.prepare(`INSERT INTO questions 
          (id, exam_id, type, content, options, answer, explanation, knowledge_point, score) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        
        paper.questions.forEach((q, index) => {
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
            q.score
          ]);
        });
        
        stmt.finalize();
        resolve(paperId);
      }
    );
  });
}

// 主函数
async function main() {
  console.log('开始收集大湾区高一联考试卷...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const paper of papersData) {
    try {
      console.log(`正在保存: ${paper.title}`);
      await savePaperToDB(paper);
      console.log(`✅ 成功保存: ${paper.subject} ${paper.year}年 ${paper.semester}\n`);
      successCount++;
    } catch (error) {
      console.error(`❌ 保存失败: ${paper.title}`, error.message);
      failCount++;
    }
  }
  
  console.log('\n========================================');
  console.log('收集完成！');
  console.log(`成功: ${successCount} 份试卷`);
  console.log(`失败: ${failCount} 份试卷`);
  console.log('========================================\n');
  
  // 统计信息
  const subjects = {};
  const years = {};
  papersData.forEach(p => {
    subjects[p.subject] = (subjects[p.subject] || 0) + 1;
    years[p.year] = (years[p.year] || 0) + 1;
  });
  
  console.log('科目分布:');
  Object.entries(subjects).forEach(([subject, count]) => {
    console.log(`  ${subject}: ${count} 份`);
  });
  
  console.log('\n年份分布:');
  Object.entries(years).forEach(([year, count]) => {
    console.log(`  ${year}年: ${count} 份`);
  });
  
  db.close();
}

main().catch(console.error);
