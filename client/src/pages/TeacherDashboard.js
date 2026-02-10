import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Table, 
  Tag, 
  Space, 
  Modal, 
  message,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  PlusOutlined, 
  PlayCircleOutlined, 
  StopOutlined,
  EyeOutlined,
  BarChartOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { examAPI } from '../services/api';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await examAPI.getExams();
      setExams(response.data);
    } catch (error) {
      message.error('获取考试列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async (examId) => {
    try {
      await examAPI.startExam(examId);
      message.success('考试已开始');
      fetchExams();
    } catch (error) {
      message.error('开始考试失败');
    }
  };

  const handleEndExam = async (examId) => {
    Modal.confirm({
      title: '确认结束考试',
      content: '结束考试后，学生将无法继续答题，是否确认？',
      onOk: async () => {
        try {
          await examAPI.endExam(examId);
          message.success('考试已结束');
          fetchExams();
        } catch (error) {
          message.error('结束考试失败');
        }
      }
    });
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'pending':
        return <Tag color="orange">待开始</Tag>;
      case 'active':
        return <Tag color="green">进行中</Tag>;
      case 'ended':
        return <Tag color="default">已结束</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  const columns = [
    {
      title: '考试名称',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '科目',
      dataIndex: 'subject',
      key: 'subject',
    },
    {
      title: '年级',
      dataIndex: 'grade',
      key: 'grade',
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (difficulty) => {
        const map = {
          'easy': '基础',
          'medium': '中等',
          'hard': '较难',
          'challenge': '挑战'
        };
        return map[difficulty] || difficulty;
      }
    },
    {
      title: '题目数量',
      dataIndex: 'question_count',
      key: 'question_count',
    },
    {
      title: '时长(分钟)',
      dataIndex: 'time_limit',
      key: 'time_limit',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          {record.status === 'pending' && (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              size="small"
              onClick={() => handleStartExam(record.id)}
            >
              开始
            </Button>
          )}
          {record.status === 'active' && (
            <Button
              danger
              icon={<StopOutlined />}
              size="small"
              onClick={() => handleEndExam(record.id)}
            >
              结束
            </Button>
          )}
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => navigate(`/teacher/results/${record.id}`)}
          >
            查看结果
          </Button>
        </Space>
      ),
    },
  ];

  const stats = [
    { title: '总考试数', value: exams.length },
    { title: '进行中', value: exams.filter(e => e.status === 'active').length },
    { title: '已结束', value: exams.filter(e => e.status === 'ended').length },
  ];

  return (
    <div className="exam-container">
      <Card className="exam-card">
        <div className="page-header">
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  onClick={() => navigate('/')}
                >
                  返回
                </Button>
                <h2>教师控制台</h2>
              </Space>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => navigate('/teacher/create-exam')}
              >
                创建新考试
              </Button>
            </Col>
          </Row>
        </div>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          {stats.map((stat, index) => (
            <Col span={8} key={index}>
              <Card>
                <Statistic title={stat.title} value={stat.value} />
              </Card>
            </Col>
          ))}
        </Row>

        <Table
          columns={columns}
          dataSource={exams}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default TeacherDashboard;
