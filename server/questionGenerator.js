// 题目生成器 - 基于 question-generator skill 实现
// 生成符合教学大纲的真实题目

const subjects = {
  math: {
    name: '数学',
    elementary: [
      { topic: '加减法', generator: () => generateMathAddition() },
      { topic: '乘除法', generator: () => generateMathMultiplication() },
      { topic: '分数', generator: () => generateMathFraction() },
      { topic: '小数', generator: () => generateMathDecimal() },
      { topic: '几何图形', generator: () => generateMathGeometry() }
    ],
    middle: [
      { topic: '代数', generator: () => generateMathAlgebra() },
      { topic: '几何', generator: () => generateMathGeometryMiddle() },
      { topic: '函数', generator: () => generateMathFunction() },
      { topic: '方程', generator: () => generateMathEquation() },
      { topic: '概率统计', generator: () => generateMathProbability() }
    ],
    high: [
      { topic: '函数与导数', generator: () => generateMathCalculus() },
      { topic: '三角函数', generator: () => generateMathTrigonometry() },
      { topic: '数列', generator: () => generateMathSequence() },
      { topic: '立体几何', generator: () => generateMathSolidGeometry() },
      { topic: '解析几何', generator: () => generateMathAnalyticGeometry() },
      { topic: '概率与统计', generator: () => generateMathStatistics() }
    ]
  },
  chinese: {
    name: '语文',
    elementary: [
      { topic: '字词', generator: () => generateChineseWords() },
      { topic: '句子', generator: () => generateChineseSentence() },
      { topic: '阅读理解', generator: () => generateChineseReading() }
    ],
    middle: [
      { topic: '古诗文', generator: () => generateChinesePoetry() },
      { topic: '现代文阅读', generator: () => generateChineseModernReading() },
      { topic: '语言运用', generator: () => generateChineseLanguage() }
    ],
    high: [
      { topic: '古诗词鉴赏', generator: () => generateChinesePoetryAppreciation() },
      { topic: '文言文阅读', generator: () => generateChineseClassical() },
      { topic: '现代文阅读', generator: () => generateChineseModernReadingHigh() }
    ]
  },
  english: {
    name: '英语',
    elementary: [
      { topic: '词汇', generator: () => generateEnglishVocabulary() },
      { topic: '语法', generator: () => generateEnglishGrammar() },
      { topic: '阅读理解', generator: () => generateEnglishReading() }
    ],
    middle: [
      { topic: '词汇语法', generator: () => generateEnglishVocabGrammar() },
      { topic: '完形填空', generator: () => generateEnglishCloze() },
      { topic: '阅读理解', generator: () => generateEnglishReadingMiddle() }
    ],
    high: [
      { topic: '语法填空', generator: () => generateEnglishGrammarFill() },
      { topic: '阅读理解', generator: () => generateEnglishReadingHigh() },
      { topic: '完形填空', generator: () => generateEnglishClozeHigh() }
    ]
  },
  physics: {
    name: '物理',
    middle: [
      { topic: '力学', generator: () => generatePhysicsMechanics() },
      { topic: '光学', generator: () => generatePhysicsOptics() },
      { topic: '电学', generator: () => generatePhysicsElectricity() }
    ],
    high: [
      { topic: '力学', generator: () => generatePhysicsMechanicsHigh() },
      { topic: '电磁学', generator: () => generatePhysicsElectromagnetism() },
      { topic: '热学', generator: () => generatePhysicsThermodynamics() }
    ]
  },
  chemistry: {
    name: '化学',
    middle: [
      { topic: '物质的构成', generator: () => generateChemistryStructure() },
      { topic: '化学反应', generator: () => generateChemistryReaction() },
      { topic: '酸碱盐', generator: () => generateChemistryAcidBase() }
    ],
    high: [
      { topic: '无机化学', generator: () => generateChemistryInorganic() },
      { topic: '有机化学', generator: () => generateChemistryOrganic() },
      { topic: '化学反应原理', generator: () => generateChemistryPrinciple() }
    ]
  }
};

// ===== 数学题目生成器 =====

function generateMathAddition() {
  const a = Math.floor(Math.random() * 90) + 10;
  const b = Math.floor(Math.random() * 90) + 10;
  const sum = a + b;
  return {
    type: 'fillblank',
    content: `计算：${a} + ${b} = ______`,
    options: [],
    answer: sum.toString(),
    explanation: `${a} + ${b} = ${sum}`,
    knowledgePoint: '两位数加法',
    score: 5
  };
}

function generateMathMultiplication() {
  const a = Math.floor(Math.random() * 9) + 2;
  const b = Math.floor(Math.random() * 9) + 2;
  const product = a * b;
  return {
    type: 'choice',
    content: `计算：${a} × ${b} = ?`,
    options: [
      `A. ${product}`,
      `B. ${product + Math.floor(Math.random() * 10) + 1}`,
      `C. ${product - Math.floor(Math.random() * 10) - 1}`,
      `D. ${product + Math.floor(Math.random() * 20) - 10}`
    ],
    answer: 'A',
    explanation: `${a} × ${b} = ${product}`,
    knowledgePoint: '表内乘法',
    score: 5
  };
}

function generateMathFraction() {
  const num = Math.floor(Math.random() * 8) + 1;
  const den = Math.floor(Math.random() * 4) + 2;
  return {
    type: 'choice',
    content: `下列分数中，等于 ${num}/${den} 的是：`,
    options: [
      `A. ${num * 2}/${den * 2}`,
      `B. ${num + 1}/${den}`,
      `C. ${num}/${den + 1}`,
      `D. ${num * 3}/${den * 2}`
    ],
    answer: 'A',
    explanation: `分数的基本性质：分子分母同时乘以相同的数，分数大小不变。${num}/${den} = ${num * 2}/${den * 2}`,
    knowledgePoint: '分数的基本性质',
    score: 10
  };
}

function generateMathDecimal() {
  const a = (Math.random() * 10).toFixed(1);
  const b = (Math.random() * 10).toFixed(1);
  const sum = (parseFloat(a) + parseFloat(b)).toFixed(1);
  return {
    type: 'fillblank',
    content: `计算：${a} + ${b} = ______`,
    options: [],
    answer: sum,
    explanation: `${a} + ${b} = ${sum}，小数加法要注意小数点对齐。`,
    knowledgePoint: '小数加法',
    score: 5
  };
}

function generateMathGeometry() {
  const shapes = ['正方形', '长方形', '三角形', '圆形'];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  return {
    type: 'choice',
    content: `下列图形中，${shape}有${shape === '正方形' || shape === '长方形' ? '4' : shape === '三角形' ? '3' : '0'}条边的是：`,
    options: ['A. 圆形', 'B. 三角形', 'C. 正方形', 'D. 长方形'],
    answer: shape === '正方形' ? 'C' : shape === '长方形' ? 'D' : shape === '三角形' ? 'B' : 'A',
    explanation: `${shape}有${shape === '正方形' || shape === '长方形' ? '4' : shape === '三角形' ? '3' : '0'}条边。`,
    knowledgePoint: '几何图形认知',
    score: 5
  };
}

function generateMathAlgebra() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 20) + 1;
  const x = Math.floor(Math.random() * 10) + 1;
  const c = a * x + b;
  return {
    type: 'fillblank',
    content: `解方程：${a}x + ${b} = ${c}，则 x = ______`,
    options: [],
    answer: x.toString(),
    explanation: `${a}x = ${c} - ${b} = ${c - b}，所以 x = ${c - b} ÷ ${a} = ${x}`,
    knowledgePoint: '一元一次方程',
    score: 10
  };
}

function generateMathGeometryMiddle() {
  const a = Math.floor(Math.random() * 10) + 3;
  const b = Math.floor(Math.random() * 10) + 3;
  const area = a * b;
  return {
    type: 'choice',
    content: `一个长方形的长为${a}cm，宽为${b}cm，它的面积是：`,
    options: [
      `A. ${a + b} cm²`,
      `B. ${area} cm²`,
      `C. ${2 * (a + b)} cm²`,
      `D. ${a * b * 2} cm²`
    ],
    answer: 'B',
    explanation: `长方形面积 = 长 × 宽 = ${a} × ${b} = ${area} cm²`,
    knowledgePoint: '长方形面积计算',
    score: 5
  };
}

function generateMathFunction() {
  return {
    type: 'choice',
    content: '函数 y = 2x + 1 的图像经过点：',
    options: ['A. (0, 0)', 'B. (1, 3)', 'C. (2, 4)', 'D. (-1, 0)'],
    answer: 'B',
    explanation: '当 x = 1 时，y = 2×1 + 1 = 3，所以经过点 (1, 3)',
    knowledgePoint: '一次函数',
    score: 10
  };
}

function generateMathEquation() {
  return {
    type: 'truefalse',
    content: '方程 2x = 6 的解是 x = 4。',
    options: ['正确', '错误'],
    answer: '错误',
    explanation: '2x = 6，解得 x = 3，不是 4。',
    knowledgePoint: '解一元一次方程',
    score: 5
  };
}

function generateMathProbability() {
  return {
    type: 'choice',
    content: '掷一枚均匀的骰子，朝上一面的点数为偶数的概率是：',
    options: ['A. 1/6', 'B. 1/3', 'C. 1/2', 'D. 2/3'],
    answer: 'C',
    explanation: '骰子有6个面，偶数有2、4、6三个，概率为 3/6 = 1/2',
    knowledgePoint: '概率计算',
    score: 10
  };
}

function generateMathCalculus() {
  return {
    type: 'choice',
    content: '函数 f(x) = x² 的导数是：',
    options: ['A. f\'(x) = x', 'B. f\'(x) = 2x', 'C. f\'(x) = x²', 'D. f\'(x) = 2'],
    answer: 'B',
    explanation: '根据求导公式，(xⁿ)\' = nxⁿ⁻¹，所以 (x²)\' = 2x',
    knowledgePoint: '导数计算',
    score: 10
  };
}

function generateMathTrigonometry() {
  return {
    type: 'fillblank',
    content: 'sin(30°) = ______',
    options: [],
    answer: '1/2',
    explanation: '根据三角函数值，sin(30°) = 1/2',
    knowledgePoint: '三角函数值',
    score: 5
  };
}

function generateMathSequence() {
  return {
    type: 'choice',
    content: '等差数列 2, 5, 8, 11, ... 的第10项是：',
    options: ['A. 29', 'B. 30', 'C. 31', 'D. 32'],
    answer: 'A',
    explanation: '首项 a₁ = 2，公差 d = 3，第10项 a₁₀ = 2 + (10-1)×3 = 29',
    knowledgePoint: '等差数列通项公式',
    score: 10
  };
}

function generateMathSolidGeometry() {
  return {
    type: 'choice',
    content: '正方体的表面积是其一个面的面积的：',
    options: ['A. 2倍', 'B. 4倍', 'C. 6倍', 'D. 8倍'],
    answer: 'C',
    explanation: '正方体有6个面，每个面面积相等，所以表面积是一个面的6倍',
    knowledgePoint: '正方体表面积',
    score: 5
  };
}

function generateMathAnalyticGeometry() {
  return {
    type: 'choice',
    content: '点 (3, 4) 到原点的距离是：',
    options: ['A. 3', 'B. 4', 'C. 5', 'D. 7'],
    answer: 'C',
    explanation: '根据距离公式，d = √(3² + 4²) = √25 = 5',
    knowledgePoint: '两点间距离公式',
    score: 10
  };
}

function generateMathStatistics() {
  return {
    type: 'choice',
    content: '数据 3, 5, 7, 9, 11 的平均数是：',
    options: ['A. 6', 'B. 7', 'C. 8', 'D. 9'],
    answer: 'B',
    explanation: '平均数 = (3+5+7+9+11)÷5 = 35÷5 = 7',
    knowledgePoint: '平均数计算',
    score: 5
  };
}

// ===== 语文题目生成器 =====

function generateChineseWords() {
  const words = [
    { word: '迫不及待', correct: '及', wrong: '急' },
    { word: '川流不息', correct: '川', wrong: '穿' },
    { word: '再接再厉', correct: '再', wrong: '在' }
  ];
  const item = words[Math.floor(Math.random() * words.length)];
  return {
    type: 'choice',
    content: `下列词语书写正确的是：`,
    options: [
      `A. ${item.word.replace(item.correct, item.wrong)}`,
      `B. ${item.word}`,
      `C. 迫不急待`,
      `D. 穿流不息`
    ],
    answer: 'B',
    explanation: `正确写法是"${item.word}"，注意"${item.correct}"字的写法。`,
    knowledgePoint: '词语辨析',
    score: 5
  };
}

function generateChineseSentence() {
  return {
    type: 'truefalse',
    content: '"春风又绿江南岸"中"绿"字是形容词。',
    options: ['正确', '错误'],
    answer: '错误',
    explanation: '"绿"在这里是动词，意思是"吹绿"，不是形容词。',
    knowledgePoint: '词类活用',
    score: 10
  };
}

function generateChineseReading() {
  return {
    type: 'choice',
    content: '"床前明月光"的下一句是：',
    options: ['A. 疑是地上霜', 'B. 举头望明月', 'C. 低头思故乡', 'D. 唯见江心秋月白'],
    answer: 'A',
    explanation: '李白《静夜思》：床前明月光，疑是地上霜。举头望明月，低头思故乡。',
    knowledgePoint: '古诗词默写',
    score: 5
  };
}

function generateChinesePoetry() {
  return {
    type: 'choice',
    content: '"春眠不觉晓"出自哪位诗人的作品？',
    options: ['A. 李白', 'B. 杜甫', 'C. 孟浩然', 'D. 王维'],
    answer: 'C',
    explanation: '"春眠不觉晓，处处闻啼鸟"出自唐代诗人孟浩然的《春晓》。',
    knowledgePoint: '古诗词作者',
    score: 5
  };
}

function generateChineseModernReading() {
  return {
    type: 'choice',
    content: '下列句子中，没有语病的一项是：',
    options: [
      'A. 通过这次活动，使我受益匪浅。',
      'B. 他的写作水平明显改进了。',
      'C. 我们要学习他刻苦钻研认真学习。',
      'D. 春天的江南是一个美丽的地方。'
    ],
    answer: 'D',
    explanation: 'A缺少主语，应删去"通过"或"使"；B"水平"与"改进"搭配不当；C缺少宾语，应在句末加"的精神"。',
    knowledgePoint: '病句辨析',
    score: 10
  };
}

function generateChineseLanguage() {
  return {
    type: 'fillblank',
    content: '"少壮不努力，______"，请补全这句古诗。',
    options: [],
    answer: '老大徒伤悲',
    explanation: '出自《长歌行》：少壮不努力，老大徒伤悲。',
    knowledgePoint: '古诗词默写',
    score: 5
  };
}

function generateChinesePoetryAppreciation() {
  return {
    type: 'choice',
    content: '"飞流直下三千尺，疑是银河落九天"运用了什么修辞手法？',
    options: ['A. 比喻', 'B. 夸张', 'C. 拟人', 'D. 排比'],
    answer: 'B',
    explanation: '"三千尺"运用了夸张的修辞手法，极写瀑布之高。',
    knowledgePoint: '修辞手法',
    score: 10
  };
}

function generateChineseClassical() {
  return {
    type: 'choice',
    content: '"学而时习之，不亦说乎"中"说"的意思是：',
    options: ['A. 说话', 'B. 高兴', 'C. 解释', 'D. 劝说'],
    answer: 'B',
    explanation: '"说"通"悦"，意思是高兴、愉快。',
    knowledgePoint: '文言文字词',
    score: 10
  };
}

function generateChineseModernReadingHigh() {
  return {
    type: 'choice',
    content: '下列文学常识表述正确的是：',
    options: [
      'A. 《红楼梦》的作者是罗贯中',
      'B. 《呐喊》是鲁迅的小说集',
      'C. 《诗经》是我国第一部纪传体通史',
      'D. 李白是宋代诗人'
    ],
    answer: 'B',
    explanation: 'A《红楼梦》作者是曹雪芹；C《诗经》是诗歌总集，《史记》是纪传体通史；D李白是唐代诗人。',
    knowledgePoint: '文学常识',
    score: 10
  };
}

// ===== 英语题目生成器 =====

function generateEnglishVocabulary() {
  return {
    type: 'choice',
    content: 'Choose the correct word: I _____ to school every day.',
    options: ['A. go', 'B. goes', 'C. going', 'D. gone'],
    answer: 'A',
    explanation: '主语 I 是第一人称，一般现在时用动词原形 go。',
    knowledgePoint: '主谓一致',
    score: 5
  };
}

function generateEnglishGrammar() {
  return {
    type: 'choice',
    content: 'What is the past tense of "go"?',
    options: ['A. goed', 'B. went', 'C. gone', 'D. going'],
    answer: 'B',
    explanation: '"go"的过去式是不规则变化 went。',
    knowledgePoint: '动词过去式',
    score: 5
  };
}

function generateEnglishReading() {
  return {
    type: 'choice',
    content: '"Hello" means ______ in Chinese.',
    options: ['A. 再见', 'B. 你好', 'C. 谢谢', 'D. 对不起'],
    answer: 'B',
    explanation: '"Hello"的中文意思是"你好"。',
    knowledgePoint: '词汇理解',
    score: 5
  };
}

function generateEnglishVocabGrammar() {
  return {
    type: 'choice',
    content: 'There ______ a book and two pens on the desk.',
    options: ['A. is', 'B. are', 'C. be', 'D. have'],
    answer: 'A',
    explanation: 'there be 句型遵循就近原则，a book 是单数，所以用 is。',
    knowledgePoint: 'there be 句型',
    score: 10
  };
}

function generateEnglishCloze() {
  return {
    type: 'choice',
    content: 'He is ______ honest boy.',
    options: ['A. a', 'B. an', 'C. the', 'D. /'],
    answer: 'B',
    explanation: 'honest 以元音音素开头，所以用 an。',
    knowledgePoint: '冠词用法',
    score: 5
  };
}

function generateEnglishReadingMiddle() {
  return {
    type: 'choice',
    content: '"How are you?" 的正确回答是：',
    options: ['A. How do you do?', 'B. Fine, thank you.', 'C. Nice to meet you.', 'D. Goodbye.'],
    answer: 'B',
    explanation: '"How are you?"是问候语，常用"Fine, thank you."回答。',
    knowledgePoint: '日常交际用语',
    score: 5
  };
}

function generateEnglishGrammarFill() {
  return {
    type: 'fillblank',
    content: 'The book ______ (write) by Lu Xun is very famous.',
    options: [],
    answer: 'written',
    explanation: 'written by Lu Xun 是过去分词短语作后置定语，修饰 the book。',
    knowledgePoint: '非谓语动词',
    score: 10
  };
}

function generateEnglishReadingHigh() {
  return {
    type: 'choice',
    content: '"To be or not to be" is a famous quote from ______.',
    options: ['A. Romeo and Juliet', 'B. Hamlet', 'C. Macbeth', 'D. Othello'],
    answer: 'B',
    explanation: '"To be or not to be"出自莎士比亚的悲剧《哈姆雷特》。',
    knowledgePoint: '文学常识',
    score: 10
  };
}

function generateEnglishClozeHigh() {
  return {
    type: 'choice',
    content: 'Only in this way ______ solve the problem.',
    options: ['A. we can', 'B. can we', 'C. we should', 'D. should we'],
    answer: 'B',
    explanation: 'only + 状语置于句首时，句子要部分倒装，将情态动词 can 提前。',
    knowledgePoint: '倒装句',
    score: 10
  };
}

// ===== 物理题目生成器 =====

function generatePhysicsMechanics() {
  const v = Math.floor(Math.random() * 10) + 5;
  const t = Math.floor(Math.random() * 10) + 5;
  const s = v * t;
  return {
    type: 'choice',
    content: `一个物体以 ${v}m/s 的速度做匀速直线运动，经过 ${t}s 后，它的位移是：`,
    options: [
      `A. ${s - v} m`,
      `B. ${s} m`,
      `C. ${s + v} m`,
      `D. ${s * 2} m`
    ],
    answer: 'B',
    explanation: `匀速直线运动位移公式：s = vt = ${v} × ${t} = ${s} m`,
    knowledgePoint: '匀速直线运动',
    score: 10
  };
}

function generatePhysicsOptics() {
  return {
    type: 'truefalse',
    content: '光在真空中的传播速度是 3×10⁸ m/s。',
    options: ['正确', '错误'],
    answer: '正确',
    explanation: '光在真空中的传播速度约为 3×10⁸ m/s。',
    knowledgePoint: '光速',
    score: 5
  };
}

function generatePhysicsElectricity() {
  const u = Math.floor(Math.random() * 10) + 5;
  const r = Math.floor(Math.random() * 10) + 5;
  const i = (u / r).toFixed(1);
  return {
    type: 'fillblank',
    content: `一段导体两端电压为 ${u}V，电阻为 ${r}Ω，通过导体的电流为 ______ A。`,
    options: [],
    answer: i,
    explanation: `根据欧姆定律 I = U/R = ${u}/${r} = ${i} A`,
    knowledgePoint: '欧姆定律',
    score: 10
  };
}

function generatePhysicsMechanicsHigh() {
  return {
    type: 'choice',
    content: '下列说法正确的是：',
    options: [
      'A. 力是维持物体运动的原因',
      'B. 物体的惯性大小与速度有关',
      'C. 作用力与反作用力大小相等、方向相反',
      'D. 物体处于平衡状态时一定静止'
    ],
    answer: 'C',
    explanation: 'A力是改变物体运动状态的原因；B惯性与速度无关，只与质量有关；D平衡状态包括静止和匀速直线运动。',
    knowledgePoint: '牛顿运动定律',
    score: 10
  };
}

function generatePhysicsElectromagnetism() {
  return {
    type: 'choice',
    content: '真空中两个点电荷之间的作用力与它们距离的：',
    options: ['A. 成正比', 'B. 成反比', 'C. 平方成正比', 'D. 平方成反比'],
    answer: 'D',
    explanation: '根据库仑定律，F = kq₁q₂/r²，作用力与距离的平方成反比。',
    knowledgePoint: '库仑定律',
    score: 10
  };
}

function generatePhysicsThermodynamics() {
  return {
    type: 'truefalse',
    content: '热量可以从低温物体自发地传到高温物体。',
    options: ['正确', '错误'],
    answer: '错误',
    explanation: '根据热力学第二定律，热量不能自发地从低温物体传到高温物体。',
    knowledgePoint: '热力学第二定律',
    score: 10
  };
}

// ===== 化学题目生成器 =====

function generateChemistryStructure() {
  return {
    type: 'choice',
    content: '水的化学式是：',
    options: ['A. CO₂', 'B. H₂O', 'C. O₂', 'D. NaCl'],
    answer: 'B',
    explanation: '水由氢元素和氧元素组成，化学式为 H₂O。',
    knowledgePoint: '化学式',
    score: 5
  };
}

function generateChemistryReaction() {
  return {
    type: 'choice',
    content: '下列变化属于化学变化的是：',
    options: [
      'A. 冰融化成水',
      'B. 酒精挥发',
      'C. 铁生锈',
      'D. 玻璃破碎'
    ],
    answer: 'C',
    explanation: '铁生锈生成了新物质铁锈，属于化学变化；其他选项都是物理变化。',
    knowledgePoint: '物理变化与化学变化',
    score: 5
  };
}

function generateChemistryAcidBase() {
  return {
    type: 'truefalse',
    content: '酸和碱反应一定生成盐和水。',
    options: ['正确', '错误'],
    answer: '正确',
    explanation: '酸和碱发生中和反应，生成盐和水。',
    knowledgePoint: '酸碱中和反应',
    score: 5
  };
}

function generateChemistryInorganic() {
  return {
    type: 'choice',
    content: '下列气体中，不能用浓硫酸干燥的是：',
    options: ['A. O₂', 'B. CO₂', 'C. NH₃', 'D. Cl₂'],
    answer: 'C',
    explanation: 'NH₃（氨气）是碱性气体，会与浓硫酸反应，所以不能用浓硫酸干燥。',
    knowledgePoint: '气体干燥',
    score: 10
  };
}

function generateChemistryOrganic() {
  return {
    type: 'choice',
    content: '甲烷的分子式是：',
    options: ['A. C₂H₆', 'B. C₂H₄', 'C. CH₄', 'D. C₆H₆'],
    answer: 'C',
    explanation: '甲烷是最简单的烃，分子式为 CH₄。',
    knowledgePoint: '有机物分子式',
    score: 5
  };
}

function generateChemistryPrinciple() {
  return {
    type: 'fillblank',
    content: '在可逆反应中，增大压强，平衡向气体分子数______的方向移动。',
    options: [],
    answer: '减少',
    explanation: '根据勒夏特列原理，增大压强，平衡向气体分子数减少的方向移动。',
    knowledgePoint: '化学平衡移动',
    score: 10
  };
}

// ===== 主生成函数 =====

function generateQuestions(subject, grade, difficulty, count, types = ['choice', 'truefalse', 'fillblank']) {
  const questions = [];
  
  // 确定学段
  let gradeLevel;
  if (grade.includes('小学')) {
    gradeLevel = 'elementary';
  } else if (grade.includes('初中')) {
    gradeLevel = 'middle';
  } else {
    gradeLevel = 'high';
  }
  
  // 获取科目数据
  const subjectData = subjects[subject];
  if (!subjectData) {
    // 如果科目不存在，返回默认题目
    return generateDefaultQuestions(count);
  }
  
  // 获取该学段的知识点
  const topics = subjectData[gradeLevel];
  if (!topics || topics.length === 0) {
    // 如果该学段没有数据，尝试使用其他学段
    const availableLevels = ['middle', 'high', 'elementary'];
    for (const level of availableLevels) {
      if (subjectData[level] && subjectData[level].length > 0) {
        topics = subjectData[level];
        break;
      }
    }
  }
  
  if (!topics || topics.length === 0) {
    return generateDefaultQuestions(count);
  }
  
  // 生成题目
  for (let i = 0; i < count; i++) {
    // 随机选择一个知识点
    const topic = topics[Math.floor(Math.random() * topics.length)];
    
    // 调用对应的生成器
    try {
      const question = topic.generator();
      
      // 根据难度调整分数
      if (difficulty === 'easy') {
        question.score = Math.max(3, Math.floor(question.score * 0.8));
      } else if (difficulty === 'hard') {
        question.score = Math.floor(question.score * 1.2);
      } else if (difficulty === 'challenge') {
        question.score = Math.floor(question.score * 1.5);
      }
      
      // 确保题型在允许的范围内
      if (types.includes(question.type)) {
        questions.push(question);
      } else {
        // 如果生成的题型不在允许范围内，重新生成
        i--;
      }
    } catch (error) {
      console.error('生成题目失败:', error);
      // 生成默认题目
      questions.push(generateDefaultQuestion(i));
    }
  }
  
  return questions;
}

function generateDefaultQuestions(count) {
  const questions = [];
  for (let i = 0; i < count; i++) {
    questions.push(generateDefaultQuestion(i));
  }
  return questions;
}

function generateDefaultQuestion(index) {
  return {
    type: 'choice',
    content: `第${index + 1}题：这是一个示例题目`,
    options: ['A. 选项1', 'B. 选项2', 'C. 选项3', 'D. 选项4'],
    answer: 'A',
    explanation: '这是示例解析',
    knowledgePoint: '基础知识',
    score: 10
  };
}

module.exports = { generateQuestions };
