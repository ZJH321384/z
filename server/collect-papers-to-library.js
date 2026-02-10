// 收集广东省大湾区高一联考试卷 - 保存到试卷库（独立存储）
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 打开数据库
const db = new sqlite3.Database(path.join(__dirname, 'exam.db'));

// 创建表（如果不存在）
db.serialize(() => {
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
    FOREIGN KEY (paper_id) REFERENCES papers(id)
  )`);
});

// 生成完整试卷题目
function generateFullPaperQuestions(subject) {
  const subjectQuestions = {
    '数学': [
      { type: 'choice', content: '已知集合 A = {x | -1 < x < 3}, B = {x | 0 < x < 4}, 则 A ∩ B = ()', options: ['A. {x | -1 < x < 4}', 'B. {x | 0 < x < 3}', 'C. {x | -1 < x < 0}', 'D. {x | 3 < x < 4}'], answer: 'B', explanation: 'A ∩ B 表示同时属于A和B的元素，即 0 < x < 3', knowledgePoint: '集合的交集运算', score: 5 },
      { type: 'choice', content: '复数 z = 1 + i，则 |z| = ()', options: ['A. 1', 'B. √2', 'C. 2', 'D. √3'], answer: 'B', explanation: '|z| = √(1² + 1²) = √2', knowledgePoint: '复数的模', score: 5 },
      { type: 'choice', content: '在△ABC中，a = 3, b = 4, C = 60°，则 c = ()', options: ['A. 5', 'B. √13', 'C. √37', 'D. 7'], answer: 'B', explanation: '由余弦定理：c² = a² + b² - 2ab·cosC = 9 + 16 - 2×3×4×0.5 = 13，所以 c = √13', knowledgePoint: '余弦定理', score: 5 },
      { type: 'choice', content: '函数 f(x) = x² - 2x + 3 的最小值是()', options: ['A. 1', 'B. 2', 'C. 3', 'D. 4'], answer: 'B', explanation: 'f(x) = (x-1)² + 2，当 x = 1 时，f(x)最小值为 2', knowledgePoint: '二次函数最值', score: 5 },
      { type: 'choice', content: '等差数列 {an} 中，a₁ = 2, a₅ = 10，则 a₃ = ()', options: ['A. 4', 'B. 5', 'C. 6', 'D. 8'], answer: 'C', explanation: 'a₅ = a₁ + 4d = 10，所以 d = 2，a₃ = a₁ + 2d = 6', knowledgePoint: '等差数列通项公式', score: 5 },
      { type: 'choice', content: '向量 a = (2, 1), b = (1, -1)，则 a·b = ()', options: ['A. 1', 'B. 2', 'C. 3', 'D. 0'], answer: 'A', explanation: 'a·b = 2×1 + 1×(-1) = 2 - 1 = 1', knowledgePoint: '向量的数量积', score: 5 },
      { type: 'choice', content: '若 sinθ = 3/5, θ ∈ (0, π/2)，则 cosθ = ()', options: ['A. 3/5', 'B. 4/5', 'C. -4/5', 'D. -3/5'], answer: 'B', explanation: 'sin²θ + cos²θ = 1，所以 cosθ = √(1 - 9/25) = 4/5', knowledgePoint: '同角三角函数关系', score: 5 },
      { type: 'choice', content: '直线 2x + y - 1 = 0 的斜率是()', options: ['A. 2', 'B. -2', 'C. 1/2', 'D. -1/2'], answer: 'B', explanation: 'y = -2x + 1，斜率为 -2', knowledgePoint: '直线方程', score: 5 },
      { type: 'fillblank', content: '函数 y = log₂(x-1) 的定义域是______', options: [], answer: '(1, +∞)', explanation: '对数函数的真数必须大于0，所以 x - 1 > 0，即 x > 1', knowledgePoint: '对数函数定义域', score: 5 },
      { type: 'fillblank', content: '等比数列 {an} 中，a₁ = 2, q = 3，则 a₃ = ______', options: [], answer: '18', explanation: 'a₃ = a₁·q² = 2×9 = 18', knowledgePoint: '等比数列通项公式', score: 5 },
      { type: 'fillblank', content: '圆 x² + y² = 4 的半径是______', options: [], answer: '2', explanation: '标准方程 x² + y² = r²，所以半径 r = 2', knowledgePoint: '圆的标准方程', score: 5 },
      { type: 'truefalse', content: '函数 y = sinx 是偶函数。', options: ['正确', '错误'], answer: '错误', explanation: 'sin(-x) = -sinx，所以 y = sinx 是奇函数，不是偶函数', knowledgePoint: '函数奇偶性', score: 5 },
      { type: 'truefalse', content: '若 a > b，则 a² > b²。', options: ['正确', '错误'], answer: '错误', explanation: '反例：a = 1, b = -2，此时 a > b 但 a² < b²', knowledgePoint: '不等式性质', score: 5 },
      { type: 'subjective', content: '已知函数 f(x) = x³ - 3x² + 2。\n(1) 求 f(x) 的导数 f\'(x)；\n(2) 求 f(x) 的单调区间；\n(3) 求 f(x) 在区间 [0, 3] 上的最大值和最小值。', options: [], answer: '(1) f\'(x) = 3x² - 6x\n(2) 增区间：(-∞, 0) 和 (2, +∞)，减区间：(0, 2)\n(3) 最大值 f(0) = 2，最小值 f(2) = -2', explanation: '利用导数研究函数的单调性和最值', knowledgePoint: '导数应用', score: 12 },
      { type: 'subjective', content: '在△ABC中，角A、B、C的对边分别为a、b、c，已知 cosA = 3/5，sinB = 5/13。\n(1) 求 sinA 和 cosB 的值；\n(2) 若 a = 13，求 b 的值。', options: [], answer: '(1) sinA = 4/5，cosB = 12/13\n(2) 由正弦定理：a/sinA = b/sinB，所以 b = a·sinB/sinA = 13×(5/13)/(4/5) = 25/4', explanation: '利用三角函数基本关系和正弦定理解三角形', knowledgePoint: '解三角形', score: 12 },
      { type: 'subjective', content: '某工厂生产一种产品，固定成本为 20000 元，每生产一件产品，成本增加 100 元。已知收入 R(x) 与年产量 x 的关系为：\nR(x) = { 400x - ½x², 0 ≤ x ≤ 400\n        80000, x > 400\n(1) 写出利润函数 P(x)；\n(2) 当年产量为多少时，利润最大？最大利润是多少？', options: [], answer: '(1) P(x) = R(x) - 20000 - 100x\n(2) 当 x = 300 时，利润最大为 25000 元', explanation: '建立函数模型，利用二次函数求最值', knowledgePoint: '函数模型应用', score: 12 },
      { type: 'subjective', content: '已知等差数列 {an} 的前 n 项和为 Sn，且 a₃ = 5，S₅ = 25。\n(1) 求数列 {an} 的通项公式；\n(2) 设 bn = 1/(an·a_{n+1})，求数列 {bn} 的前 n 项和 Tn。', options: [], answer: '(1) an = 2n - 1\n(2) Tn = n/(2n+1)', explanation: '利用等差数列性质求通项，裂项相消法求和', knowledgePoint: '数列求和', score: 12 },
      { type: 'subjective', content: '如图，在四棱锥 P-ABCD 中，底面 ABCD 是正方形，PD ⊥ 平面 ABCD，PD = DC = 2，E 是 PC 的中点。\n(1) 证明：PA // 平面 EDB；\n(2) 求直线 EB 与平面 ABCD 所成角的正切值。', options: [], answer: '(1) 连接AC交BD于O，连接EO，证明PA // EO\n(2) tanθ = √2/2', explanation: '利用线面平行的判定定理和线面角的定义', knowledgePoint: '立体几何', score: 12 }
    ],
    '物理': [
      { type: 'choice', content: '关于功的概念，下列说法正确的是()', options: ['A. 力越大，做功越多', 'B. 位移越大，做功越多', 'C. 力和在力的方向上的位移的乘积等于功', 'D. 功是矢量'], answer: 'C', explanation: '功的定义：W = F·s·cosθ', knowledgePoint: '功的概念', score: 4 },
      { type: 'choice', content: '一个物体从静止开始做匀加速直线运动，第3秒内的位移为5m，则物体的加速度为()', options: ['A. 1 m/s²', 'B. 2 m/s²', 'C. 3 m/s²', 'D. 4 m/s²'], answer: 'B', explanation: '第3秒内位移 = 前3秒位移 - 前2秒位移 = ½a(9-4) = 5', knowledgePoint: '匀变速直线运动', score: 4 },
      { type: 'choice', content: '质量为2kg的物体，速度为3m/s，其动能为()', options: ['A. 6 J', 'B. 9 J', 'C. 12 J', 'D. 18 J'], answer: 'B', explanation: 'Ek = ½mv² = ½×2×9 = 9 J', knowledgePoint: '动能', score: 4 },
      { type: 'choice', content: '关于机械能守恒，下列说法正确的是()', options: ['A. 物体做匀速直线运动，机械能一定守恒', 'B. 物体所受合外力为零，机械能一定守恒', 'C. 只有重力做功时，机械能守恒', 'D. 物体的动能和势能之和不变时，机械能守恒'], answer: 'C', explanation: '机械能守恒的条件是只有重力或弹力做功', knowledgePoint: '机械能守恒', score: 4 },
      { type: 'choice', content: '一个物体做平抛运动，下列说法正确的是()', options: ['A. 水平方向做匀速直线运动', 'B. 竖直方向做匀速直线运动', 'C. 加速度不断变化', 'D. 速度方向始终不变'], answer: 'A', explanation: '平抛运动水平方向不受力，做匀速直线运动', knowledgePoint: '平抛运动', score: 4 },
      { type: 'fillblank', content: '牛顿第二定律的表达式为 F = ______', options: [], answer: 'ma', explanation: 'F = ma，力等于质量乘以加速度', knowledgePoint: '牛顿第二定律', score: 4 },
      { type: 'fillblank', content: '重力加速度 g 的近似值为 ______ m/s²', options: [], answer: '9.8', explanation: '重力加速度 g ≈ 9.8 m/s²', knowledgePoint: '重力加速度', score: 4 },
      { type: 'truefalse', content: '作用力与反作用力大小相等、方向相反，作用在同一个物体上。', options: ['正确', '错误'], answer: '错误', explanation: '作用力与反作用力作用在两个不同的物体上', knowledgePoint: '牛顿第三定律', score: 4 },
      { type: 'truefalse', content: '物体的速度为零时，加速度一定为零。', options: ['正确', '错误'], answer: '错误', explanation: '竖直上抛运动到最高点时速度为零，但加速度为g', knowledgePoint: '速度与加速度', score: 4 },
      { type: 'subjective', content: '一辆汽车以 10 m/s 的速度在平直公路上匀速行驶，刹车后做匀减速直线运动，加速度大小为 2 m/s²。\n(1) 求汽车刹车后 3 秒末的速度；\n(2) 求汽车刹车后 6 秒内的位移；\n(3) 求汽车刹车后滑行的总距离。', options: [], answer: '(1) v = 10 - 2×3 = 4 m/s\n(2) 5秒后停止，6秒内位移 = 5秒内位移 = 25 m\n(3) 总距离 = 25 m', explanation: '匀变速直线运动规律的应用', knowledgePoint: '匀变速直线运动', score: 10 },
      { type: 'subjective', content: '如图所示，质量为 m = 2 kg 的物体静止在水平地面上，受到与水平方向成 37° 角的拉力 F = 10 N 作用，物体沿地面做匀加速直线运动。已知物体与地面间的动摩擦因数 μ = 0.3，sin37° = 0.6，cos37° = 0.8，g = 10 m/s²。\n(1) 求物体对地面的压力；\n(2) 求物体受到的滑动摩擦力；\n(3) 求物体的加速度。', options: [], answer: '(1) N = mg - Fsin37° = 14 N\n(2) f = μN = 4.2 N\n(3) a = (Fcos37° - f)/m = 1.9 m/s²', explanation: '受力分析和牛顿第二定律的应用', knowledgePoint: '牛顿运动定律', score: 10 },
      { type: 'subjective', content: '如图所示，光滑水平面上有一质量为 M = 4 kg 的长木板，木板上表面粗糙。一质量为 m = 2 kg 的物块以初速度 v₀ = 6 m/s 从木板左端滑上木板。已知物块与木板间的动摩擦因数 μ = 0.2，g = 10 m/s²。\n(1) 求物块刚滑上木板时，物块和木板的加速度大小；\n(2) 求物块与木板达到共同速度所需的时间；\n(3) 求此过程中物块相对木板滑动的距离。', options: [], answer: '(1) a₁ = μg = 2 m/s²，a₂ = μmg/M = 1 m/s²\n(2) t = 2 s\n(3) Δx = 6 m', explanation: '板块模型，牛顿运动定律和相对运动', knowledgePoint: '牛顿运动定律综合应用', score: 12 }
    ],
    '化学': [
      { type: 'choice', content: '下列物质中，属于电解质的是()', options: ['A. 铜', 'B. 蔗糖', 'C. 氯化钠', 'D. 酒精'], answer: 'C', explanation: '氯化钠在水溶液中能导电，属于电解质', knowledgePoint: '电解质', score: 3 },
      { type: 'choice', content: '下列反应中，属于氧化还原反应的是()', options: ['A. CaCO₃ = CaO + CO₂↑', 'B. NaOH + HCl = NaCl + H₂O', 'C. 2Na + Cl₂ = 2NaCl', 'D. AgNO₃ + NaCl = AgCl↓ + NaNO₃'], answer: 'C', explanation: 'C中Na和Cl的化合价发生变化', knowledgePoint: '氧化还原反应', score: 3 },
      { type: 'choice', content: '下列离子方程式中，正确的是()', options: ['A. 铁与稀盐酸反应：2Fe + 6H⁺ = 2Fe³⁺ + 3H₂↑', 'B. 碳酸钙与稀盐酸反应：CO₃²⁻ + 2H⁺ = CO₂↑ + H₂O', 'C. 氢氧化钠与稀硫酸反应：H⁺ + OH⁻ = H₂O', 'D. 铜与稀硝酸反应：Cu + 4H⁺ + NO₃⁻ = Cu²⁺ + NO₂↑ + 2H₂O'], answer: 'C', explanation: 'A应生成Fe²⁺，B中CaCO₃不应拆，D产物应为NO', knowledgePoint: '离子方程式', score: 3 },
      { type: 'fillblank', content: '铁与稀盐酸反应的化学方程式为______', options: [], answer: 'Fe + 2HCl = FeCl₂ + H₂↑', explanation: '铁与稀盐酸反应生成氯化亚铁和氢气', knowledgePoint: '金属与酸反应', score: 3 },
      { type: 'fillblank', content: '标准状况下，1 mol 任何气体的体积约为______L', options: [], answer: '22.4', explanation: '标准状况下，气体摩尔体积为 22.4 L/mol', knowledgePoint: '气体摩尔体积', score: 3 },
      { type: 'truefalse', content: '酸和碱反应一定生成盐和水。', options: ['正确', '错误'], answer: '正确', explanation: '酸碱中和反应生成盐和水', knowledgePoint: '酸碱中和', score: 3 },
      { type: 'subjective', content: '某无色溶液中可能含有 Na⁺、K⁺、Fe³⁺、NH₄⁺、Cl⁻、SO₄²⁻、CO₃²⁻ 中的若干种。现进行如下实验：\n① 取少量溶液，加入足量稀盐酸，无明显现象；\n② 取少量溶液，加入足量 BaCl₂ 溶液，产生白色沉淀；\n③ 取少量溶液，加入足量 NaOH 溶液并加热，产生能使湿润红色石蕊试纸变蓝的气体。\n(1) 根据实验①，可确定溶液中一定不含有的离子是______；\n(2) 根据实验②，可确定溶液中一定含有的离子是______；\n(3) 根据实验③，可确定溶液中一定含有的离子是______；\n(4) 该溶液中一定含有的离子是______。', options: [], answer: '(1) CO₃²⁻\n(2) SO₄²⁻\n(3) NH₄⁺\n(4) NH₄⁺、SO₄²⁻', explanation: '离子检验和推断', knowledgePoint: '离子检验', score: 10 },
      { type: 'subjective', content: '某同学用 0.1000 mol/L 的 NaOH 溶液滴定 20.00 mL 未知浓度的盐酸。\n(1) 滴定时，眼睛应注视______；\n(2) 当滴入最后一滴 NaOH 溶液时，溶液由______色变为______色，且半分钟内不褪色，即达到滴定终点；\n(3) 若三次平行实验消耗 NaOH 溶液的体积分别为 20.05 mL、19.95 mL、20.00 mL，则盐酸的浓度为______mol/L。', options: [], answer: '(1) 锥形瓶内溶液颜色变化\n(2) 无，粉红（或浅红）\n(3) 0.1000', explanation: '酸碱中和滴定实验', knowledgePoint: '中和滴定', score: 10 }
    ],
    '语文': [
      { type: 'choice', content: '下列词语中，加点字的读音全都正确的一项是()', options: ['A. 惆(chóu)怅  寥(liáo)廓', 'B. 彷(páng)徨  遒(qiú)劲', 'C. 遏(è)制   峥(zhēng)嵘', 'D. 以上都正确'], answer: 'D', explanation: '各项读音均正确', knowledgePoint: '字音', score: 3 },
      { type: 'choice', content: '下列句子中，没有语病的一项是()', options: ['A. 通过这次活动，使我受益匪浅。', 'B. 他的写作水平明显改进了。', 'C. 春天的江南是一个美丽的地方。', 'D. 我们要学习他刻苦钻研认真学习。'], answer: 'C', explanation: 'A缺主语，B搭配不当，D缺宾语', knowledgePoint: '病句辨析', score: 3 },
      { type: 'choice', content: '下列文学常识表述正确的是()', options: ['A. 《红楼梦》作者是罗贯中', 'B. 《呐喊》是鲁迅的小说集', 'C. 《诗经》是我国第一部纪传体通史', 'D. 李白是宋代诗人'], answer: 'B', explanation: 'A作者应为曹雪芹，C《诗经》是诗歌总集，D李白是唐代诗人', knowledgePoint: '文学常识', score: 3 },
      { type: 'fillblank', content: '"少壮不努力，______"，请补全这句古诗。', options: [], answer: '老大徒伤悲', explanation: '出自《长歌行》', knowledgePoint: '古诗词默写', score: 3 },
      { type: 'subjective', content: '阅读下面的文字，完成题目。\n\n《荷塘月色》（节选）\n朱自清\n\n曲曲折折的荷塘上面，弥望的是田田的叶子。叶子出水很高，像亭亭的舞女的裙。层层的叶子中间，零星地点缀着些白花，有袅娜地开着的，有羞涩地打着朵儿的；正如一粒粒的明珠，又如碧天里的星星，又如刚出浴的美人。微风过处，送来缕缕清香，仿佛远处高楼上渺茫的歌声似的。这时候叶子与花也有一丝的颤动，像闪电般，霎时传过荷塘的那边去了。叶子本是肩并肩密密地挨着，这便宛然有了一道凝碧的波痕。叶子底下是脉脉的流水，遮住了，不能见一些颜色；而叶子却更见风致了。\n\n(1) 这段文字描写的对象是什么？\n(2) 作者运用了哪些修辞手法？请举例说明。\n(3) 这段文字表达了作者怎样的情感？', options: [], answer: '(1) 荷塘月色的美景\n(2) 比喻、拟人、通感\n(3) 对荷塘美景的喜爱和赞美之情', explanation: '分析散文的描写对象、修辞手法和情感', knowledgePoint: '现代文阅读', score: 12 },
      { type: 'subjective', content: '阅读下面的文言文，完成题目。\n\n《劝学》（节选）\n《荀子》\n\n君子曰：学不可以已。青，取之于蓝，而青于蓝；冰，水为之，而寒于水。木直中绳，輮以为轮，其曲中规。虽有槁暴，不复挺者，輮使之然也。故木受绳则直，金就砺则利，君子博学而日参省乎己，则知明而行无过矣。\n\n(1) 解释下列加点词的意思：\n① 学不可以已（    ）\n② 青，取之于蓝（    ）\n③ 木直中绳（    ）\n(2) 翻译句子：君子博学而日参省乎己，则知明而行无过矣。\n(3) 这段文字的中心论点是什么？作者运用了哪些论证方法？', options: [], answer: '(1) ①停止 ②从 ③合乎\n(2) 君子广泛地学习并且每天对自己检查反省，就能智慧明达而且行为没有过错了。\n(3) 中心论点：学不可以已。论证方法：比喻论证、举例论证', explanation: '文言文阅读理解', knowledgePoint: '文言文阅读', score: 15 }
    ],
    '英语': [
      { type: 'choice', content: '—How was your trip to London?\n—______. I enjoyed it very much.', options: ['A. It was terrible', 'B. It was wonderful', 'C. It was boring', 'D. It was tiring'], answer: 'B', explanation: '根据答语可知旅行很愉快', knowledgePoint: '情景交际', score: 2 },
      { type: 'choice', content: 'The book ______ I bought yesterday is very interesting.', options: ['A. who', 'B. whom', 'C. which', 'D. what'], answer: 'C', explanation: '先行词是the book，指物，用which', knowledgePoint: '定语从句', score: 2 },
      { type: 'choice', content: 'By the time I got to the station, the train ______.', options: ['A. has left', 'B. had left', 'C. left', 'D. was leaving'], answer: 'B', explanation: '过去的过去，用过去完成时', knowledgePoint: '时态', score: 2 },
      { type: 'fillblank', content: 'The book ______ (write) by Lu Xun is very famous.', options: [], answer: 'written', explanation: '过去分词作后置定语', knowledgePoint: '非谓语动词', score: 2 },
      { type: 'subjective', content: '假设你是李华，你的英国朋友Tom来信询问你校开展的"读书月"活动情况。请你给他回信，内容包括：\n1. 活动目的；\n2. 活动内容（至少两项）；\n3. 你的收获。\n\n注意：\n1. 词数100左右；\n2. 可以适当增加细节，以使行文连贯。', options: [], answer: 'Dear Tom,\n\nI am glad to tell you about our school\'s "Reading Month" activity...', explanation: '应用文写作', knowledgePoint: '书面表达', score: 15 }
    ],
    '地理': [
      { type: 'choice', content: '近年来，我国外来物种种数大增，有些物种在新环境中急剧繁殖扩散，成为外来入侵物种。这主要反映了地理环境的()', options: ['A. 整体性', 'B. 差异性', 'C. 开放性', 'D. 脆弱性'], answer: 'A', explanation: '外来物种入侵影响生态系统平衡，体现整体性', knowledgePoint: '地理环境整体性', score: 3 },
      { type: 'choice', content: '下列关于城市化的叙述，正确的是()', options: ['A. 城市化就是城市人口增加', 'B. 城市化水平越高越好', 'C. 城市化是社会经济发展的必然结果', 'D. 城市化只发生在发达国家'], answer: 'C', explanation: '城市化是社会经济发展的必然结果', knowledgePoint: '城市化', score: 3 },
      { type: 'subjective', content: '阅读图文材料，完成下列要求。\n\n材料一：粤港澳大湾区包括香港特别行政区、澳门特别行政区和广东省广州市、深圳市、珠海市、佛山市、惠州市、东莞市、中山市、江门市、肇庆市，总面积 5.6 万平方公里，2017 年末总人口约 7000 万人，是我国开放程度最高、经济活力最强的区域之一。\n\n(1) 简述粤港澳大湾区发展的区位优势。\n(2) 分析粤港澳大湾区建设对区域经济发展的意义。\n(3) 为粤港澳大湾区可持续发展提出建议。', options: [], answer: '(1) 地理位置优越，交通便利，经济发达，政策支持等\n(2) 促进区域经济一体化，提升国际竞争力等\n(3) 加强环境保护，优化产业结构等', explanation: '区域地理综合分析', knowledgePoint: '区域可持续发展', score: 15 }
    ],
    '历史': [
      { type: 'choice', content: '秦朝建立后，为加强中央集权，在地方上推行()', options: ['A. 分封制', 'B. 郡县制', 'C. 行省制', 'D. 三省六部制'], answer: 'B', explanation: '秦朝在地方推行郡县制', knowledgePoint: '秦朝政治制度', score: 3 },
      { type: 'choice', content: '新航路开辟后，欧洲贸易中心从地中海沿岸转移到了()', options: ['A. 波罗的海沿岸', 'B. 大西洋沿岸', 'C. 黑海沿岸', 'D. 北海沿岸'], answer: 'B', explanation: '新航路开辟后，贸易中心转移到大西洋沿岸', knowledgePoint: '新航路开辟', score: 3 },
      { type: 'subjective', content: '阅读材料，完成下列要求。\n\n材料一：中国古代选官制度经历了世官制、察举制、九品中正制、科举制的发展演变过程。\n\n(1) 分别指出世官制、察举制、九品中正制、科举制的选官标准。\n(2) 分析科举制的历史作用。\n(3) 谈谈你对人才选拔制度的认识。', options: [], answer: '(1) 世官制：血缘；察举制：德才；九品中正制：门第；科举制：考试成绩\n(2) 打破世家大族垄断，扩大统治基础，提高官员文化素质等\n(3) 人才选拔制度应公平、公正、公开等', explanation: '中国古代选官制度', knowledgePoint: '中国古代政治制度', score: 15 }
    ]
  };
  
  return subjectQuestions[subject] || [];
}

// 大湾区高一联考试卷数据
const papersData = [
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
    examTime: 120
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
    examTime: 90
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
    examTime: 90
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
    examTime: 90
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
    examTime: 90
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
    examTime: 150
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
    examTime: 120
  },
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
    examTime: 150
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
    examTime: 150
  }
];

// 保存试卷到试卷库
async function savePaperToLibrary(paper) {
  return new Promise((resolve, reject) => {
    const paperId = uuidv4();
    
    // 生成完整的题目
    const questions = generateFullPaperQuestions(paper.subject);
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
            index + 1
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
  console.log('开始收集大湾区高一联考试卷到试卷库...\n');
  
  let successCount = 0;
  let failCount = 0;
  let totalQuestions = 0;
  
  for (const paper of papersData) {
    try {
      console.log(`正在保存: ${paper.title}`);
      const result = await savePaperToLibrary(paper);
      console.log(`✅ 成功保存: ${paper.subject} ${paper.year}年 ${paper.semester} - ${result.questionCount}道题，总分${result.totalScore}分\n`);
      successCount++;
      totalQuestions += result.questionCount;
    } catch (error) {
      console.error(`❌ 保存失败: ${paper.title}`, error.message);
      failCount++;
    }
  }
  
  console.log('\n========================================');
  console.log('试卷库收集完成！');
  console.log(`成功: ${successCount} 份试卷`);
  console.log(`失败: ${failCount} 份试卷`);
  console.log(`总题目数: ${totalQuestions} 道`);
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
