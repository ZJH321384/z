import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const examAPI = {
  // 创建考试
  createExam: (data) => api.post('/exams', data),
  
  // 获取考试列表
  getExams: () => api.get('/exams'),
  
  // 获取单个考试
  getExam: (id) => api.get(`/exams/${id}`),
  
  // 开始考试
  startExam: (id) => api.post(`/exams/${id}/start`),
  
  // 结束考试
  endExam: (id) => api.post(`/exams/${id}/end`),
  
  // 提交答案
  submitAnswer: (examId, data) => api.post(`/exams/${examId}/submit-answer`, data),
  
  // 提交带图片的答案
  submitAnswerWithImage: (examId, formData) => {
    return api.post(`/exams/${examId}/submit-answer-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // 获取考试结果
  getResults: (id) => api.get(`/exams/${id}/results`),
};

export default api;
