// Word 文档解析器 - 自动识别并提取题目
const mammoth = require('mammoth');

/**
 * 解析 Word 文档并提取题目
 * @param {Buffer} buffer - Word 文档的 Buffer
 * @returns {Promise<Array>} - 提取的题目数组
 */
async function parseWordDocument(buffer) {
    try {
        // 使用 mammoth 提取文本
        const result = await mammoth.extractRawText({ buffer });
        const text = result.value;
        
        console.log('Word文档原始内容预览:');
        console.log(text.substring(0, 1000));
        console.log('...');
        console.log(`文档总长度: ${text.length} 字符`);
        
        // 解析题目
        const questions = extractQuestions(text);
        
        return {
            success: true,
            questions: questions,
            totalCount: questions.length,
            message: `成功解析 ${questions.length} 道题目`
        };
    } catch (error) {
        console.error('解析 Word 文档失败:', error);
        return {
            success: false,
            error: '解析失败: ' + error.message
        };
    }
}

/**
 * 从文本中提取题目
 * @param {string} text - 文档文本内容
 * @returns {Array} - 题目数组
 */
function extractQuestions(text) {
    // 将文档分成题目部分和答案部分
    const answerSectionMarkers = [
        '参考答案',
        '参考答案与解析',
        '答案与解析',
        '答案',
        '解析',
        '试题答案',
        '参考解答'
    ];
    
    let questionText = text;
    let answerText = '';
    
    // 查找答案部分
    for (const marker of answerSectionMarkers) {
        const index = text.indexOf(marker);
        if (index !== -1) {
            questionText = text.substring(0, index);
            answerText = text.substring(index);
            console.log(`找到答案部分标记: "${marker}"，位置: ${index}`);
            break;
        }
    }
    
    // 解析题目
    const questions = parseQuestionSection(questionText);
    
    // 解析答案并匹配到题目
    if (answerText && questions.length > 0) {
        parseAnswerSection(answerText, questions);
    }
    
    return questions;
}

/**
 * 解析题目部分
 */
function parseQuestionSection(text) {
    const questions = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log(`题目部分共 ${lines.length} 行文本`);
    
    // 检测大题类型
    let inChoiceSection = false;
    let inFillBlankSection = false;
    let inSubjectiveSection = false;
    let questionCounter = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 检测大题类型
        if (/^[一二三四五六七八九十]+[、\.．]\s*选择/.test(line) || 
            (line.includes('选择题') && line.length < 50)) {
            inChoiceSection = true;
            inFillBlankSection = false;
            inSubjectiveSection = false;
            console.log(`发现选择题部分: ${line.substring(0, 50)}`);
            continue;
        }
        if (/^[一二三四五六七八九十]+[、\.．]\s*填空/.test(line) || 
            (line.includes('填空题') && line.length < 50)) {
            inChoiceSection = false;
            inFillBlankSection = true;
            inSubjectiveSection = false;
            console.log(`发现填空题部分: ${line.substring(0, 50)}`);
            continue;
        }
        if (/^[一二三四五六七八九十]+[、\.．]\s*解答/.test(line) || 
            /^[一二三四五六七八九十]+[、\.．]\s*主观/.test(line) ||
            (line.includes('解答题') && line.length < 50) || 
            (line.includes('主观题') && line.length < 50)) {
            inChoiceSection = false;
            inFillBlankSection = false;
            inSubjectiveSection = true;
            console.log(`发现解答题部分: ${line.substring(0, 50)}`);
            continue;
        }
        
        // 跳过说明性文字
        if (isInstructionLine(line)) {
            continue;
        }
        
        // 尝试解析题目
        let question = null;
        
        if (inChoiceSection) {
            question = parseChoiceQuestion(line, questionCounter + 1);
        } else if (inFillBlankSection) {
            question = parseFillBlankQuestion(line, questionCounter + 1);
        } else if (inSubjectiveSection) {
            question = parseSubjectiveQuestion(line, questionCounter + 1);
        } else {
            // 不在任何大题部分，尝试自动识别
            question = autoDetectQuestion(line, questionCounter + 1);
        }
        
        if (question) {
            questionCounter++;
            question.question_order = questionCounter;
            questions.push(question);
            console.log(`识别到第 ${questionCounter} 题: ${question.type}, ${question.content.substring(0, 50)}...`);
        }
    }
    
    console.log(`题目部分共解析出 ${questions.length} 道题目`);
    return questions;
}

/**
 * 解析答案部分并匹配到题目
 */
function parseAnswerSection(text, questions) {
    console.log('开始解析答案部分...');
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // 尝试匹配 "1. A" 或 "1.A" 或 "1、A" 这样的格式
    for (const line of lines) {
        // 选择题答案格式
        const choiceAnswerMatch = line.match(/^(\d+)[\.\.、\s]+([A-Da-d])/);
        if (choiceAnswerMatch) {
            const questionNum = parseInt(choiceAnswerMatch[1]);
            const answer = choiceAnswerMatch[2].toUpperCase();
            
            // 找到对应的题目
            const question = questions.find(q => q.question_order === questionNum);
            if (question && question.type === 'choice') {
                question.answer = answer;
                console.log(`第 ${questionNum} 题答案: ${answer}`);
            }
            continue;
        }
        
        // 填空题答案格式 "1. 答案内容"
        const fillBlankMatch = line.match(/^(\d+)[\.\.、\s]+(.+)/);
        if (fillBlankMatch) {
            const questionNum = parseInt(fillBlankMatch[1]);
            const answer = fillBlankMatch[2].trim();
            
            // 排除选项（如果答案是A/B/C/D，可能是选择题）
            if (!/^[A-D]$/.test(answer)) {
                const question = questions.find(q => q.question_order === questionNum);
                if (question && (question.type === 'fillblank' || question.type === 'subjective')) {
                    question.answer = answer;
                    console.log(`第 ${questionNum} 题答案: ${answer.substring(0, 50)}...`);
                }
            }
        }
    }
    
    // 统计有多少题有答案
    const withAnswer = questions.filter(q => q.answer && q.answer !== '待补充').length;
    console.log(`答案匹配完成: ${withAnswer}/${questions.length} 道题有答案`);
}

/**
 * 判断是否是说明性文字
 */
function isInstructionLine(line) {
    const instructionKeywords = [
        '注意事项',
        '考试时间',
        '满分',
        '考生务必',
        '答题前',
        '回答选择',
        '考试结束',
        '本大题共',
        '每小题',
        '在每小题',
        '只有一项',
        '符合题目',
        '请将答案',
        '写在答题',
        '卷上无效'
    ];
    
    return instructionKeywords.some(keyword => line.includes(keyword)) ||
           /^[（(]\d+分[)）]/.test(line) ||
           (line.startsWith('共') && line.includes('分'));
}

/**
 * 解析选择题
 * 格式: 题目内容（  ）A. xxx B. xxx C. xxx D. xxx
 */
function parseChoiceQuestion(line, number) {
    // 检测是否有选项标记 A. B. C. D.
    const hasOptions = /[A-D][\.．、]/.test(line);
    
    if (!hasOptions) return null;
    
    // 提取题目内容（到第一个选项前）
    const contentMatch = line.match(/^(.+?)[（(]\s*[)）]/);
    let content = '';
    
    if (contentMatch) {
        content = contentMatch[1].trim();
    } else {
        // 没有括号，取到第一个A.之前
        const firstOptionIndex = line.search(/[A-D][\.．、]/);
        if (firstOptionIndex > 0) {
            content = line.substring(0, firstOptionIndex).trim();
        }
    }
    
    if (content.length < 5) return null;
    
    // 提取选项
    const options = [];
    const optionRegex = /([A-D])[\.．、]\s*([^A-D]+?)(?=[A-D][\.．、]|$)/g;
    let match;
    
    while ((match = optionRegex.exec(line)) !== null) {
        options.push({
            label: match[1],
            content: match[2].trim()
        });
    }
    
    if (options.length < 2) return null;
    
    // 构建选项数组
    const finalOptions = [];
    ['A', 'B', 'C', 'D'].forEach(label => {
        const found = options.find(o => o.label === label);
        if (found) {
            finalOptions.push(`${label}. ${found.content}`);
        }
    });
    
    return {
        type: 'choice',
        content: content,
        options: finalOptions,
        answer: '待补充',
        explanation: '暂无解析',
        knowledgePoint: '综合知识',
        score: 5,
        question_order: number
    };
}

/**
 * 解析填空题
 * 格式: 题目内容______或（  ）
 */
function parseFillBlankQuestion(line, number) {
    // 检测填空标记
    const hasBlank = /[_]{2,}/.test(line) || /[（(]\s*[)）]/.test(line);
    
    if (!hasBlank) return null;
    
    // 清理题目
    let content = line;
    
    if (content.length < 5) return null;
    
    return {
        type: 'fillblank',
        content: content,
        options: [],
        answer: '待补充',
        explanation: '暂无解析',
        knowledgePoint: '综合知识',
        score: 4,
        question_order: number
    };
}

/**
 * 解析主观题
 */
function parseSubjectiveQuestion(line, number) {
    // 主观题通常有分值标记
    const hasScore = /[（(]\d+分[)）]/.test(line);
    
    // 或者题目较长
    if (!hasScore && line.length < 20) return null;
    
    // 清理题目
    let content = line.replace(/[（(]\d+分[)）]/, '').trim();
    
    if (content.length < 10) return null;
    
    return {
        type: 'subjective',
        content: content,
        options: [],
        answer: '待补充',
        explanation: '暂无解析',
        knowledgePoint: '综合知识',
        score: 10,
        question_order: number
    };
}

/**
 * 自动识别题目类型
 */
function autoDetectQuestion(line, number) {
    // 优先检测选择题（有A.B.C.D.选项）
    if (/[A-D][\.．、]/.test(line) && line.match(/[A-D][\.．、]/g).length >= 2) {
        return parseChoiceQuestion(line, number);
    }
    
    // 检测填空题
    if (/[_]{2,}/.test(line) || /[（(]\s*[)）]/.test(line)) {
        return parseFillBlankQuestion(line, number);
    }
    
    // 检测判断题
    if ((line.includes('正确') && line.includes('错误')) || 
        (line.includes('对') && line.includes('错'))) {
        return {
            type: 'truefalse',
            content: line,
            options: ['正确', '错误'],
            answer: '待补充',
            explanation: '暂无解析',
            knowledgePoint: '综合知识',
            score: 3,
            question_order: number
        };
    }
    
    return null;
}

/**
 * 批量解析多个题目并格式化为试卷格式
 * @param {Array} questions - 解析的题目数组
 * @param {Object} paperInfo - 试卷信息
 * @returns {Object} - 格式化的试卷对象
 */
function formatAsPaper(questions, paperInfo) {
    const totalScore = questions.reduce((sum, q) => sum + q.score, 0);
    
    return {
        paper: {
            title: paperInfo.title,
            examType: paperInfo.examType,
            province: paperInfo.province,
            subject: paperInfo.subject,
            year: paperInfo.year,
            grade: paperInfo.grade,
            examTime: paperInfo.examTime,
            questionCount: questions.length,
            totalScore: totalScore
        },
        questions: questions.map((q, index) => ({
            ...q,
            question_order: index + 1
        }))
    };
}

module.exports = {
    parseWordDocument,
    extractQuestions,
    formatAsPaper
};
