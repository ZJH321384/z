// 题目生成器 - 模拟调用 skill 生成题目
// 实际项目中，这里会调用 question-generator skill

const subjects = {
  math: {
    name: '数学',
    elementary: ['加减法', '乘除法', '分数', '小数', '几何图形'],
    middle: ['代数', '几何', '函数', '方程', '概率统计'],
    high: ['函数与导数', '三角函数', '数列', '立体几何', '解析几何', '概率与统计']
  },
  chinese: {
    name: '语文',
    elementary: ['字词', '句子', '阅读理解', '作文'],
    middle: ['古诗文', '现代文阅读', '作文', '语言运用'],
    high: ['古诗词鉴赏', '文言文阅读', '现代文阅读', '作文']
  },
  english: {
    name: '英语',
    elementary: ['词汇', '语法', '阅读理解', '写作'],
    middle: ['词汇语法', '完形填空', '阅读理解', '写作'],
    high: ['听力', '阅读理解', '完形填空', '语法填空', '写作']
  },
  physics: {
    name: '物理',
    middle: ['力学', '热学', '光学', '电学'],
    high: ['力学', '电磁学', '热学', '光学', '原子物理']
  },
  chemistry: {
    name: '化学',
    middle: ['物质的构成', '化学反应', '酸碱盐'],
    high: ['无机化学', '有机化学', '化学反应原理', '结构化学']
  }
};

// 生成选择题
const generateChoiceQuestion = (subject, grade, difficulty, knowledgePoint) => {
  const templates = {
    math: [
      {
        content: `计算：${Math.floor(Math.random() * 100)} ${['+', '-', '×', '÷'][Math.floor(Math.random() * 4)]} ${Math.floor(Math.random() * 100)} = ?`,
        options: ['A. 50', 'B. 100', 'C. 150', 'D. 200'],
        answer: 'B'
      },
      {
        content: '一个正方形的边长为4cm，它的面积是多少？',
        options: ['A. 8cm²', 'B. 12cm²', 'C. 16cm²', 'D. 20cm²'],
        answer: 'C'
      },
      {
        content: '如果 2x + 5 = 15，那么 x = ?',
        options: ['A. 3', 'B. 5', 'C. 7', 'D. 10'],
        answer: 'B'
      }
    ],
    chinese: [
      {
        content: '下列词语中，没有错别字的一项是：',
        options: ['A. 迫不及待', 'B. 迫不急待', 'C. 迫不急待', 'D. 迫不急待'],
        answer: 'A'
      },
      {
        content: '"春风又绿江南岸"中"绿"字的意思是：',
        options: ['A. 颜色', 'B. 吹绿', 'C. 绿色', 'D. 植物'],
        answer: 'B'
      }
    ],
    english: [
      {
        content: 'Choose the correct answer: I _____ to school every day.',
        options: ['A. go', 'B. goes', 'C. going', 'D. gone'],
        answer: 'A'
      },
      {
        content: 'What is the past tense of "eat"?',
        options: ['A. eated', 'B. ate', 'C. eaten', 'D. eating'],
        answer: 'B'
      }
    ],
    physics: [
      {
        content: '一个物体做匀速直线运动，速度为5m/s，经过10秒后，它的位移是：',
        options: ['A. 25m', 'B. 50m', 'C. 100m', 'D. 150m'],
        answer: 'B'
      },
      {
        content: '力的单位是：',
        options: ['A. 千克', 'B. 米', 'C. 牛顿', 'D. 秒'],
        answer: 'C'
      }
    ],
    chemistry: [
      {
        content: '水的化学式是：',
        options: ['A. CO₂', 'B. H₂O', 'C. O₂', 'D. NaCl'],
        answer: 'B'
      },
      {
        content: '下列物质中，属于单质的是：',
        options: ['A. 水', 'B. 二氧化碳', 'C. 氧气', 'D. 氯化钠'],
        answer: 'C'
      }
    ]
  };

  const subjectTemplates = templates[subject] || templates.math;
  const template = subjectTemplates[Math.floor(Math.random() * subjectTemplates.length)];
  
  return {
    type: 'choice',
    content: template.content,
    options: template.options,
    answer: template.answer,
    explanation: `本题考查${knowledgePoint}的知识点。正确答案是${template.answer}。`,
    knowledgePoint: knowledgePoint,
    score: difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : difficulty === 'hard' ? 15 : 20
  };
};

// 生成判断题
const generateTrueFalseQuestion = (subject, grade, difficulty, knowledgePoint) => {
  const templates = {
    math: [
      { content: '0是最小的自然数。', answer: 'true' },
      { content: '所有的偶数都是合数。', answer: 'false' },
      { content: '圆的周长与直径的比值是π。', answer: 'true' }
    ],
    chinese: [
      { content: '"床前明月光"是李白的诗句。', answer: 'true' },
      { content: '《红楼梦》的作者是罗贯中。', answer: 'false' }
    ],
    english: [
      { content: '"I am" is the correct form of the verb "to be" for the first person singular.', answer: 'true' },
      { content: '"She go to school" is grammatically correct.', answer: 'false' }
    ],
    physics: [
      { content: '力是维持物体运动的原因。', answer: 'false' },
      { content: '光在真空中的传播速度是3×10⁸m/s。', answer: 'true' }
    ],
    chemistry: [
      { content: '氧气是一种无色无味的气体。', answer: 'true' },
      { content: '酸和碱反应一定生成盐和水。', answer: 'true' }
    ]
  };

  const subjectTemplates = templates[subject] || templates.math;
  const template = subjectTemplates[Math.floor(Math.random() * subjectTemplates.length)];
  
  return {
    type: 'truefalse',
    content: template.content,
    options: ['正确', '错误'],
    answer: template.answer === 'true' ? '正确' : '错误',
    explanation: `本题考查${knowledgePoint}的知识点。`,
    knowledgePoint: knowledgePoint,
    score: difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : difficulty === 'hard' ? 8 : 10
  };
};

// 生成填空题
const generateFillBlankQuestion = (subject, grade, difficulty, knowledgePoint) => {
  const templates = {
    math: [
      { content: '3 + ___ = 10', answer: '7' },
      { content: '一个直角三角形的两个锐角之和是___度。', answer: '90' },
      { content: '圆的面积公式是S = ___。', answer: 'πr²' }
    ],
    chinese: [
      { content: '"春眠不觉晓，处处闻啼鸟"出自唐代诗人___的《春晓》。', answer: '孟浩然' },
      { content: '《论语》是记录___及其弟子言行的书。', answer: '孔子' }
    ],
    english: [
      { content: 'The plural form of "child" is ___.', answer: 'children' },
      { content: '"To be or not to be" is a famous quote from ___.', answer: 'Hamlet' }
    ],
    physics: [
      { content: '力的三要素是：大小、方向和___。', answer: '作用点' },
      { content: '1标准大气压约等于___Pa。', answer: '1.01×10⁵' }
    ],
    chemistry: [
      { content: '水的化学式是___。', answer: 'H₂O' },
      { content: '元素周期表中，原子序数为1的元素是___。', answer: '氢' }
    ]
  };

  const subjectTemplates = templates[subject] || templates.math;
  const template = subjectTemplates[Math.floor(Math.random() * subjectTemplates.length)];
  
  return {
    type: 'fillblank',
    content: template.content,
    options: [],
    answer: template.answer,
    explanation: `本题考查${knowledgePoint}的知识点。正确答案是${template.answer}。`,
    knowledgePoint: knowledgePoint,
    score: difficulty === 'easy' ? 5 : difficulty === 'medium' ? 8 : difficulty === 'hard' ? 12 : 15
  };
};

// 生成主观题（需要上传图片）
const generateSubjectiveQuestion = (subject, grade, difficulty, knowledgePoint) => {
  const templates = {
    math: [
      '请解答以下应用题，并写出详细的解题过程：小明买了3支铅笔和2个笔记本，共花费15元。已知每支铅笔2元，求每个笔记本的价格。',
      '证明：三角形的内角和等于180度。',
      '解方程：2x² - 5x + 2 = 0'
    ],
    chinese: [
      '请以"春天"为题，写一篇不少于300字的作文。',
      '阅读下面的短文，回答问题：...',
      '请赏析下面这首诗的意境和表现手法。'
    ],
    english: [
      'Write a short essay (about 100 words) about your favorite hobby.',
      'Read the following passage and answer the questions...',
      'Translate the following paragraph into English...'
    ],
    physics: [
      '一个物体从静止开始做匀加速直线运动，经过5秒后速度达到10m/s。求：(1)物体的加速度；(2)这5秒内物体的位移。',
      '请设计一个实验验证牛顿第二定律，并说明实验步骤和注意事项。',
      '分析斜面上物体的受力情况，并画出受力分析图。'
    ],
    chemistry: [
      '写出实验室制取氧气的化学方程式，并说明实验装置和收集方法。',
      '某溶液中含有Na⁺、K⁺、Cl⁻、SO₄²⁻等离子，请设计实验方案鉴别这些离子。',
      '计算：将10g NaOH溶解在90g水中，求所得溶液的质量分数。'
    ]
  };

  const subjectTemplates = templates[subject] || templates.math;
  const content = subjectTemplates[Math.floor(Math.random() * subjectTemplates.length)];
  
  return {
    type: 'subjective',
    content: content,
    options: [],
    answer: '（主观题，需人工批改）',
    explanation: `本题考查${knowledgePoint}的综合运用能力。`,
    knowledgePoint: knowledgePoint,
    score: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : difficulty === 'hard' ? 20 : 25
  };
};

// 主生成函数
export const generateQuestions = (subject, grade, difficulty, count, types = ['choice', 'truefalse', 'fillblank']) => {
  const questions = [];
  const gradeLevel = grade.includes('小学') ? 'elementary' : grade.includes('初中') ? 'middle' : 'high';
  const subjectData = subjects[subject];
  const knowledgePoints = subjectData ? (subjectData[gradeLevel] || subjectData.middle) : ['基础知识'];
  
  for (let i = 0; i < count; i++) {
    const knowledgePoint = knowledgePoints[Math.floor(Math.random() * knowledgePoints.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let question;
    switch (type) {
      case 'choice':
        question = generateChoiceQuestion(subject, grade, difficulty, knowledgePoint);
        break;
      case 'truefalse':
        question = generateTrueFalseQuestion(subject, grade, difficulty, knowledgePoint);
        break;
      case 'fillblank':
        question = generateFillBlankQuestion(subject, grade, difficulty, knowledgePoint);
        break;
      case 'subjective':
        question = generateSubjectiveQuestion(subject, grade, difficulty, knowledgePoint);
        break;
      default:
        question = generateChoiceQuestion(subject, grade, difficulty, knowledgePoint);
    }
    
    questions.push(question);
  }
  
  return questions;
};

export default generateQuestions;
