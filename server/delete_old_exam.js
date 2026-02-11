const http = require('http');

const API_URL = 'localhost';
const API_PORT = 3001;

// 删除考试
function deleteExam(examId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: API_URL,
            port: API_PORT,
            path: `/api/exams/${examId}`,
            method: 'DELETE'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`删除考试 ${examId} 状态码:`, res.statusCode);
                resolve(data);
            });
        });

        req.on('error', (err) => {
            console.error('请求失败:', err.message);
            reject(err);
        });
        req.end();
    });
}

// 主流程
async function main() {
    const oldExamId = '9c7a344f-0399-4fa0-b023-0ca1d498fa84';

    try {
        console.log('删除有问题的旧考试...');
        await deleteExam(oldExamId);
        console.log('✅ 旧考试已删除！');
    } catch (error) {
        console.error('删除失败:', error.message);
    }
}

main();
