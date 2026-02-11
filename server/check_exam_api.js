const http = require('http');

const API_URL = 'localhost';
const API_PORT = 3001;

// 获取考试详情
function getExam(examId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: API_URL,
            port: API_PORT,
            path: `/api/exams/${examId}`,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('原始响应:', data);
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function main() {
    const examId = 'a0231d90-edfd-41c3-93fb-a1c9d2927dc4';
    console.log('检查考试API返回数据...\n');
    const data = await getExam(examId);
    console.log('\n解析后的数据:');
    console.log('title:', data.title);
    console.log('subject:', data.subject);
    console.log('questions:', data.questions ? `有 ${data.questions.length} 题` : '无');
}

main();
