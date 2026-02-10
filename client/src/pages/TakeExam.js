import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Card,
  Button,
  Radio,
  Input,
  Upload,
  message,
  Progress,
  Modal,
  Space,
  Tag,
  Divider
} from 'antd';
import {
  UploadOutlined,
  SendOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { io } from 'socket.io-client';
import { examAPI } from '../services/api';

const SOCKET_URL = 'http://localhost:3001';

const TakeExam = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const location = useLocation();
  const { studentName, studentId } = location.state || {};

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [socket, setSocket] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // 验证学生信息
  useEffect(() => {
    if (!studentName || !studentId) {
      message.error('请先填写考生信息');
      navigate('/student');
    }
  }, [studentName, studentId, navigate]);

  // 获取考试信息
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await examAPI.getExam(examId);
        setExam(response.data);
        setQuestions(response.data.questions);
        setTimeLeft(response.data.time_limit * 60);
      } catch (error) {
        message.error('获取考试信息失败');
        navigate('/student');
      }
    };

    if (examId) {
      fetchExam();
    }
  }, [examId, navigate]);

  // Socket.io 连接
  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.emit('join-exam', { examId, studentName });

    newSocket.on('exam-ended', () => {
      message.warning('考试已结束');
      handleSubmit();
    });

    return () => {
      newSocket.close();
    };
  }, [examId, studentName]);

  // 倒计时
  useEffect(() => {
    if (timeLeft <= 0 || submitted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleImageUpload = (questionId, info) => {
    if (info.file.status === 'done') {
      message.success('图片上传成功');
      setAnswers(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          image: info.file.response?.filename || info.file.name
        }
      }));
    } else if (info.file.status === 'error') {
      message.error('图片上传失败');
    }
  };

  const handleSubmit = useCallback(async () => {
    if (submitted) return;

    setLoading(true);
    try {
      // 提交所有答案
      for (const [questionId, answer] of Object.entries(answers)) {
        const question = questions.find(q => q.id === questionId);
        
        if (question.type === 'subjective' && answer?.image) {
          // 主观题带图片
          const formData = new FormData();
          formData.append('studentName', studentName);
          formData.append('studentId', studentId);
          formData.append('questionId', questionId);
          formData.append('answer', answer.text || '');
          // 这里简化处理，实际应该上传文件
          await examAPI.submitAnswer(examId, {
            studentName,
            studentId,
            questionId,
            answer: answer.text || '[图片作答]'
          });
        } else {
          // 客观题
          await examAPI.submitAnswer(examId, {
            studentName,
            studentId,
            questionId,
            answer: typeof answer === 'string' ? answer : answer?.text || ''
          });
        }
      }

      setSubmitted(true);
      message.success('答案提交成功！');
      
      Modal.success({
        title: '考试完成',
        content: '您的答案已成功提交，请等待老师批改。',
        onOk: () => navigate('/student')
      });
    } catch (error) {
      message.error('提交答案失败');
    } finally {
      setLoading(false);
    }
  }, [answers, examId, studentName, studentId, questions, submitted, navigate]);

  const confirmSubmit = () => {
    const answeredCount = Object.keys(answers).length;
    const totalCount = questions.length;

    Modal.confirm({
      title: '确认提交',
      content: (
        <div>
          <p>您已作答 {answeredCount}/{totalCount} 题</p>
          {answeredCount < totalCount && (
            <p style={{ color: '#ff4d4f' }}>
              <WarningOutlined /> 还有 {totalCount - answeredCount} 题未作答
            </p>
          )}
          <p>提交后将无法修改，是否确认？</p>
        </div>
      ),
      onOk: handleSubmit
    });
  };

  const renderQuestion = (question, index) => {
    const answer = answers[question.id];

    switch (question.type) {
      case 'choice':
        return (
          <Radio.Group
            value={answer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {question.options.map((option, idx) => (
                <div
                  key={idx}
                  className={`answer-option ${answer === option.charAt(0) ? 'selected' : ''}`}
                  onClick={() => handleAnswerChange(question.id, option.charAt(0))}
                >
                  <Radio value={option.charAt(0)}>{option}</Radio>
                </div>
              ))}
            </Space>
          </Radio.Group>
        );

      case 'truefalse':
        return (
          <Radio.Group
            value={answer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          >
            <Space>
              <Radio.Button value="正确">正确</Radio.Button>
              <Radio.Button value="错误">错误</Radio.Button>
            </Space>
          </Radio.Group>
        );

      case 'fillblank':
        return (
          <Input
            placeholder="请输入答案"
            value={answer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            style={{ width: '100%' }}
          />
        );

      case 'subjective':
        return (
          <div>
            <Input.TextArea
              rows={4}
              placeholder="请输入文字答案（可选）"
              value={answer?.text || ''}
              onChange={(e) => handleAnswerChange(question.id, { ...answer, text: e.target.value })}
              style={{ marginBottom: 16 }}
            />
            <Upload
              name="image"
              action={`${SOCKET_URL}/api/exams/${examId}/submit-answer-image`}
              onChange={(info) => handleImageUpload(question.id, info)}
              maxCount={1}
              listType="picture"
            >
              <Button icon={<UploadOutlined />}>上传答题图片</Button>
            </Upload>
            <p style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
              主观题需要上传答题过程的图片
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const getQuestionTypeLabel = (type) => {
    const labels = {
      choice: '选择题',
      truefalse: '判断题',
      fillblank: '填空题',
      subjective: '主观题'
    };
    return labels[type] || type;
  };

  if (!exam) {
    return <div style={{ textAlign: 'center', padding: 48 }}>加载中...</div>;
  }

  const progress = Math.round((Object.keys(answers).length / questions.length) * 100);

  return (
    <div className="exam-container">
      {/* 计时器 */}
      <div className={`timer-display ${timeLeft < 300 ? 'warning' : ''}`}>
        <ClockCircleOutlined /> {formatTime(timeLeft)}
      </div>

      {/* 考生信息 */}
      <Card className="exam-card" style={{ marginBottom: 16 }}>
        <Space size="large">
          <span><strong>考生：</strong>{studentName}</span>
          <span><strong>学号：</strong>{studentId}</span>
          <span><strong>考试：</strong>{exam.title}</span>
          <span><strong>科目：</strong>{exam.subject}</span>
        </Space>
      </Card>

      {/* 进度条 */}
      <Card className="exam-card" style={{ marginBottom: 16 }}>
        <Progress percent={progress} status="active" />
        <p style={{ textAlign: 'center', marginTop: 8 }}>
          已作答 {Object.keys(answers).length}/{questions.length} 题
        </p>
      </Card>

      {/* 题目导航 */}
      <Card className="exam-card" style={{ marginBottom: 16 }}>
        <Space wrap>
          {questions.map((q, idx) => (
            <Button
              key={q.id}
              type={answers[q.id] ? 'primary' : 'default'}
              size="small"
              onClick={() => setCurrentQuestion(idx)}
            >
              {idx + 1}
            </Button>
          ))}
        </Space>
      </Card>

      {/* 当前题目 */}
      {questions[currentQuestion] && (
        <Card className="exam-card">
          <div className="question-item">
            <div style={{ marginBottom: 16 }}>
              <Tag color="blue">{getQuestionTypeLabel(questions[currentQuestion].type)}</Tag>
              <Tag color="orange">{questions[currentQuestion].score}分</Tag>
              <span style={{ marginLeft: 8, color: '#666' }}>
                第 {currentQuestion + 1}/{questions.length} 题
              </span>
            </div>
            
            <h3 style={{ marginBottom: 16 }}>
              {questions[currentQuestion].content}
            </h3>

            {renderQuestion(questions[currentQuestion], currentQuestion)}
          </div>

          <Divider />

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button
              disabled={currentQuestion === 0}
              onClick={() => setCurrentQuestion(prev => prev - 1)}
            >
              上一题
            </Button>
            
            {currentQuestion < questions.length - 1 ? (
              <Button
                type="primary"
                onClick={() => setCurrentQuestion(prev => prev + 1)}
              >
                下一题
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={confirmSubmit}
                loading={loading}
                size="large"
              >
                提交答卷
              </Button>
            )}
          </Space>
        </Card>
      )}
    </div>
  );
};

export default TakeExam;
