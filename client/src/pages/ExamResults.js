import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  Divider,
  List,
  Typography
} from 'antd';
import {
  ArrowLeftOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { examAPI } from '../services/api';

const { Title, Text } = Typography;

const ExamResults = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState({
    totalStudents: 0,
    avgScore: 0,
    maxScore: 0,
    minScore: 0
  });

  useEffect(() => {
    fetchData();
  }, [examId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 获取考试信息
      const examResponse = await examAPI.getExam(examId);
      setExam(examResponse.data);

      // 获取答题结果
      const resultsResponse = await examAPI.getResults(examId);
      setResults(resultsResponse.data);

      // 计算统计信息
      calculateStatistics(resultsResponse.data, examResponse.data.questions);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (results, questions) => {
    if (!results.length) return;

    // 按学生分组
    const studentGroups = {};
    results.forEach(result => {
      if (!studentGroups[result.student_id]) {
        studentGroups[result.student_id] = {
          name: result.student_name,
          id: result.student_id,
          answers: []
        };
      }
      studentGroups[result.student_id].answers.push(result);
    });

    // 计算每个学生的得分
    const scores = Object.values(studentGroups).map(student => {
      let score = 0;
      student.answers.forEach(answer => {
        const question = questions.find(q => q.id === answer.question_id);
        if (question && answer.answer === question.answer) {
          score += question.score;
        }
      });
      return { ...student, score };
    });

    const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
    const maxScore = Math.max(...scores.map(s => s.score), 0);
    const minScore = Math.min(...scores.map(s => s.score), 0);

    setStatistics({
      totalStudents: scores.length,
      avgScore: scores.length ? Math.round(totalScore / scores.length) : 0,
      maxScore,
      minScore,
      studentScores: scores.sort((a, b) => b.score - a.score)
    });
  };

  const getAnswerStatus = (answer, correctAnswer) => {
    return answer === correctAnswer ? 'correct' : 'wrong';
  };

  const columns = [
    {
      title: '排名',
      key: 'rank',
      render: (_, __, index) => (
        <Space>
          {index === 0 && <TrophyOutlined style={{ color: '#ffd700', fontSize: 18 }} />}
          {index === 1 && <TrophyOutlined style={{ color: '#c0c0c0', fontSize: 18 }} />}
          {index === 2 && <TrophyOutlined style={{ color: '#cd7f32', fontSize: 18 }} />}
          <span style={{ fontWeight: index < 3 ? 'bold' : 'normal' }}>{index + 1}</span>
        </Space>
      ),
      width: 80
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '学号',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      render: (score) => (
        <Text strong style={{ color: score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f', fontSize: 16 }}>
          {score}
        </Text>
      ),
      sorter: (a, b) => a.score - b.score,
      defaultSortOrder: 'descend'
    },
    {
      title: '等级',
      key: 'grade',
      render: (_, record) => {
        const score = record.score;
        let grade = '不及格';
        let color = 'red';
        if (score >= 90) {
          grade = '优秀';
          color = 'green';
        } else if (score >= 80) {
          grade = '良好';
          color = 'cyan';
        } else if (score >= 70) {
          grade = '中等';
          color = 'blue';
        } else if (score >= 60) {
          grade = '及格';
          color = 'orange';
        }
        return <Tag color={color}>{grade}</Tag>;
      }
    }
  ];

  const renderQuestionAnalysis = () => {
    if (!exam || !results.length) return null;

    return exam.questions.map((question, index) => {
      const questionResults = results.filter(r => r.question_id === question.id);
      const correctCount = questionResults.filter(r => r.answer === question.answer).length;
      const correctRate = questionResults.length ? Math.round((correctCount / questionResults.length) * 100) : 0;

      return (
        <Card key={question.id} size="small" style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 8 }}>
            <Tag color="blue">第{index + 1}题</Tag>
            <Tag>{question.type === 'choice' ? '选择题' : question.type === 'truefalse' ? '判断题' : question.type === 'fillblank' ? '填空题' : '主观题'}</Tag>
            <Tag color="orange">{question.score}分</Tag>
          </div>
          <p style={{ marginBottom: 8 }}>{question.content}</p>
          <p style={{ color: '#52c41a' }}><strong>正确答案：</strong>{question.answer}</p>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">正确率：{correctRate}% ({correctCount}/{questionResults.length})</Text>
          </div>
        </Card>
      );
    });
  };

  if (!exam) {
    return <div style={{ textAlign: 'center', padding: 48 }}>加载中...</div>;
  }

  return (
    <div className="exam-container">
      <Card className="exam-card">
        <div className="page-header">
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/teacher')}>
              返回
            </Button>
            <h2>考试结果分析</h2>
          </Space>
        </div>

        <Divider />

        {/* 考试基本信息 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="考试名称"
                value={exam.title}
                valueStyle={{ fontSize: 16 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="科目"
                value={exam.subject}
                valueStyle={{ fontSize: 16 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="年级"
                value={exam.grade}
                valueStyle={{ fontSize: 16 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="难度"
                value={exam.difficulty === 'easy' ? '基础' : exam.difficulty === 'medium' ? '中等' : exam.difficulty === 'hard' ? '较难' : '挑战'}
                valueStyle={{ fontSize: 16 }}
              />
            </Card>
          </Col>
        </Row>

        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="参考人数"
                value={statistics.totalStudents}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均分"
                value={statistics.avgScore}
                suffix="分"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="最高分"
                value={statistics.maxScore}
                suffix="分"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="最低分"
                value={statistics.minScore}
                suffix="分"
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* 成绩排名 */}
        <Title level={4}>成绩排名</Title>
        <Table
          columns={columns}
          dataSource={statistics.studentScores || []}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          style={{ marginBottom: 24 }}
        />

        <Divider />

        {/* 题目分析 */}
        <Title level={4}>题目分析</Title>
        <div style={{ maxHeight: '600px', overflow: 'auto' }}>
          {renderQuestionAnalysis()}
        </div>
      </Card>
    </div>
  );
};

export default ExamResults;
