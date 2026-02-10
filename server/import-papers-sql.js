// 直接通过 SQLite 导入试卷到试卷库 - 无需 Node.js 依赖
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 生成 UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 生成完整试卷题目
function generateFullPaperQuestions(subject) {
  const subjectQuestions = {
    '数学': [
      { type: 'choice', content: '已知集合 A = {x | -1 < x < 3}, B = {x | 0 < x < 4}, 则 A ∩ B = ()', options: ['A. {x | -1 < x < 4}', 'B. {x | 0 < x < 3}', 'C. {x | -1 < x < 0}', 'D. {x | 3 < x < 4}'], answer: 'B', explanation: 'A ∩ B 表示同时属于A和B的元素，即 0 < x < 3', knowledgePoint: '集合的交集运算', score: 5 },
      { type: 'choice', content: '复数 z = 1 + i，则 |z| = ()', options: ['A. 1', 'B. √2', 'C. 2', 'D. √3'], answer: 'B', explanation: '|z| = √(1² + 1²) = √2', knowledgePoint: '复数的模', score: 5 },
      { type: 'choice', content: '在△ABC中，a = 3, b = 4, C = 60°，则 c = ()', options: ['A. 5', 'B. √13', 'C. √37', 'D. 7'], answer: 'B', explanation: '由余弦定理：c² = a² + b² - 2ab·cosC = 9 + 16 - 2×3×4×0.5 = 13，所以 c = √13', knowledgePoint: '余弦定理', score: 5 },
      { type: 'choice', content: '函数 f(x) = x² - 2x + 3 的最小值是()', options: ['A. 1', 'B. 2', 'C. 3', 'D. 4'], answer: 'B', explanation: 'f(x) = (x-1)² + 2，当 x = 1 时，f(x)最小值为 2', knowledgePoint: '二次函数最值', score: 5 },
      { type: 'choice', content: '等差数列 {an} 中，a₁ = 2, a₅ = 10，则 a₃ = ()', options: ['A. 4', 'B. 5', 'C. 6', 'D. 8'], answer: 'C', explanation: 'a₅ = a₁ + 4d = 10，所以 d = 2，a₃ = a₁ + 2d = 6', knowledgePoint: '等差数列通项公式', score: 5 },
      { type: 'choice', content: '向量 a = (2, 1), b = (1, -1)，则 a·b = ()', options: ['A. 1', 'B. 2', 'C. 3', 'D. 0'], answer: 'A', explanation: 'a·b = 2×1 + 1×(-1) = 2 - 1 = 1', knowledgePoint: '向量的数量