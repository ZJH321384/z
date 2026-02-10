import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  List,
  Tag,
  Space,
  Input,
  Modal,
  Form,
  message,
  Empty
} from 'antd';
import {
  ArrowLeftOutlined,
  EnterOutlined,
  ClockCircleOutlined,
  BookOutlined,
  UserOutlined
} from '@ant-design/icons';
import { examAPI } from '../services/api';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchActiveExams();
  }, []);

  const fetchActiveExams = async () => {
    setLoading(true);
    try {
      const response = await examAPI.getExams();
      // 只显示进行中的考试
      const activeExams = response.data.filter(exam => exam.status === 'active');
      setExams(activeExams);
    } catch (error) {
      message.error('获取考试列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinExam = (exam) => {
    setSelectedExam(exam);
    setJoinModalVisible(true);
  };

  const handleJoinSubmit = async (values) => {
    if (!selectedExam) return;

    // 跳转到考试页面，传递学生信息
    navigate(`/student/exam/${selectedExam.id}`, {
      state: {
        studentName: values.studentName,
        studentId: values.studentId
      }
    });
    setJoinModalVisible(false);
  };

  const getDifficultyTag = (difficulty) => {
    const map = {
      'easy': { text: '基础', color: 'green' },
      'medium': { text: '中等', color: 'blue' },
      'hard': { text: '较难', color: 'orange' },
      'challenge': { text: '挑战', color: 'red' }
    };
    const config = map[difficulty] || { text: difficulty, color: 'default' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  return (
    <div className="exam-container">
      <Card className="exam-card">
        <div className="page-header">
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
              返回
            </Button>
            <h2>学生端 - 加入考试</h2>
          </Space>
        </div>

        {exams.length === 0 ? (
          <Empty
            description="暂无进行中的考试"
            style={{ marginTop: 48 }}
          />
        ) : (
          <List
            grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }}
            dataSource={exams}
            loading={loading}
            renderItem={exam => (
              <List.Item>
                <Card
                  hoverable
                  className="exam-list-item"
                  actions={[
                    <Button
                      type="primary"
                      icon={<EnterOutlined />}
                      onClick={() => handleJoinExam(exam)}
                    >
                      进入考试
                    </Button>
                  ]}
                >
                  <Card.Meta
                    title={
                      <Space>
                        <BookOutlined />
                        {exam.title}
                      </Space>
                    }
                    description={
                      <div style={{ marginTop: 12 }}>
                        <p>
                          <strong>科目：</strong>{exam.subject}
                        </p>
                        <p>
                          <strong>年级：</strong>{exam.grade}
                        </p>
                        <p>
                          <strong>难度：</strong>{getDifficultyTag(exam.difficulty)}
                        </p>
                        <p>
                          <strong>题目数量：</strong>{exam.question_count} 题
                        </p>
                        <p>
                          <ClockCircleOutlined /> {exam.time_limit} 分钟
                        </p>
                      </div>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title="填写考生信息"
        open={joinModalVisible}
        onCancel={() => setJoinModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleJoinSubmit}
        >
          <Form.Item
            label="姓名"
            name="studentName"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            label="学号"
            name="studentId"
            rules={[{ required: true, message: '请输入学号' }]}
          >
            <Input placeholder="请输入学号" />
          </Form.Item>

          {selectedExam && (
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
              <p><strong>考试：</strong>{selectedExam.title}</p>
              <p><strong>时长：</strong>{selectedExam.time_limit} 分钟</p>
              <p><strong>题目数：</strong>{selectedExam.question_count} 题</p>
            </div>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              开始答题
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StudentDashboard;
