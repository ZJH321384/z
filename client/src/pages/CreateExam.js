import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Steps,
  message,
  Row,
  Col,
  Space,
  Divider,
  Tag,
  List
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { examAPI } from '../services/api';
import { generateQuestions } from '../utils/questionGenerator';

const { Step } = Steps;
const { Option } = Select;

const subjects = [
  { value: 'math', label: '数学' },
  { value: 'chinese', label: '语文' },
  { value: 'english', label: '英语' },
  { value: 'physics', label: '物理' },
  { value: 'chemistry', label: '化学' },
  { value: 'biology', label: '生物' },
  { value: 'history', label: '历史' },
  { value: 'geography', label: '地理' },
  { value: 'politics', label: '政治' },
];

const grades = [
  { value: '小学三年级', label: '小学三年级' },
  { value: '小学四年级', label: '小学四年级' },
  { value: '小学五年级', label: '小学五年级' },
  { value: '小学六年级', label: '小学六年级' },
  { value: '初中一年级', label: '初中一年级' },
  { value: '初中二年级', label: '初中二年级' },
  { value: '初中三年级', label: '初中三年级' },
  { value: '高中一年级', label: '高中一年级' },
  { value: '高中二年级', label: '高中二年级' },
  { value: '高中三年级', label: '高中三年级' },
];

const difficulties = [
  { value: 'easy', label: '基础', color: 'green' },
  { value: 'medium', label: '中等', color: 'blue' },
  { value: 'hard', label: '较难', color: 'orange' },
  { value: 'challenge', label: '挑战', color: 'red' },
];

const CreateExam = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [examData, setExamData] = useState(null);

  const handleGenerateQuestions = async (values) => {
    setLoading(true);
    try {
      // 调用题目生成器
      const questions = generateQuestions(
        values.subject,
        values.grade,
        values.difficulty,
        values.questionCount,
        values.questionTypes
      );
      
      setGeneratedQuestions(questions);
      setExamData(values);
      setCurrentStep(1);
      message.success(`成功生成 ${questions.length} 道题目`);
    } catch (error) {
      message.error('生成题目失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async () => {
    setLoading(true);
    try {
      const data = {
        title: examData.title,
        subject: subjects.find(s => s.value === examData.subject)?.label || examData.subject,
        grade: examData.grade,
        difficulty: examData.difficulty,
        questionCount: examData.questionCount,
        timeLimit: examData.timeLimit,
        questions: generatedQuestions,
      };

      await examAPI.createExam(data);
      message.success('考试创建成功');
      navigate('/teacher');
    } catch (error) {
      message.error('创建考试失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (examData) {
      handleGenerateQuestions(examData);
    }
  };

  const renderQuestionPreview = (question, index) => {
    const typeLabels = {
      choice: '选择题',
      truefalse: '判断题',
      fillblank: '填空题',
      subjective: '主观题'
    };

    return (
      <Card 
        key={index} 
        size="small" 
        style={{ marginBottom: 12 }}
        title={
          <Space>
            <Tag color="blue">{typeLabels[question.type]}</Tag>
            <span>第{index + 1}题</span>
            <Tag color="orange">{question.score}分</Tag>
          </Space>
        }
      >
        <p><strong>题目：</strong>{question.content}</p>
        {question.options && question.options.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <strong>选项：</strong>
            <ul style={{ marginTop: 4, paddingLeft: 20 }}>
              {question.options.map((option, idx) => (
                <li key={idx}>{option}</li>
              ))}
            </ul>
          </div>
        )}
        <p style={{ marginTop: 8, color: '#52c41a' }}>
          <strong>答案：</strong>{question.answer}
        </p>
        <p style={{ marginTop: 4, color: '#666', fontSize: 12 }}>
          <strong>解析：</strong>{question.explanation}
        </p>
        <p style={{ marginTop: 4, color: '#1890ff', fontSize: 12 }}>
          <strong>知识点：</strong>{question.knowledgePoint}
        </p>
      </Card>
    );
  };

  const steps = [
    {
      title: '设置考试信息',
      content: (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerateQuestions}
          initialValues={{
            questionCount: 10,
            timeLimit: 60,
            questionTypes: ['choice', 'truefalse', 'fillblank'],
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="考试名称"
                name="title"
                rules={[{ required: true, message: '请输入考试名称' }]}
              >
                <Input placeholder="例如：数学期中测试" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="科目"
                name="subject"
                rules={[{ required: true, message: '请选择科目' }]}
              >
                <Select placeholder="选择科目">
                  {subjects.map(s => (
                    <Option key={s.value} value={s.value}>{s.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="年级"
                name="grade"
                rules={[{ required: true, message: '请选择年级' }]}
              >
                <Select placeholder="选择年级">
                  {grades.map(g => (
                    <Option key={g.value} value={g.value}>{g.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="难度"
                name="difficulty"
                rules={[{ required: true, message: '请选择难度' }]}
              >
                <Select placeholder="选择难度">
                  {difficulties.map(d => (
                    <Option key={d.value} value={d.value}>
                      <Tag color={d.color}>{d.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="题目数量"
                name="questionCount"
                rules={[{ required: true, message: '请输入题目数量' }]}
              >
                <InputNumber min={1} max={50} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="考试时长（分钟）"
                name="timeLimit"
                rules={[{ required: true, message: '请输入考试时长' }]}
              >
                <InputNumber min={5} max={180} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="题型选择"
            name="questionTypes"
            rules={[{ required: true, message: '请至少选择一种题型' }]}
          >
            <Select mode="multiple" placeholder="选择题型">
              <Option value="choice">选择题</Option>
              <Option value="truefalse">判断题</Option>
              <Option value="fillblank">填空题</Option>
              <Option value="subjective">主观题（需上传图片）</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<PlusOutlined />}
              size="large"
            >
              自动生成题目
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      title: '预览题目',
      content: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRegenerate}
                loading={loading}
              >
                重新生成
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleCreateExam}
                loading={loading}
              >
                确认创建考试
              </Button>
            </Space>
          </div>
          <div style={{ maxHeight: '500px', overflow: 'auto' }}>
            {generatedQuestions.map((q, index) => renderQuestionPreview(q, index))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="exam-container">
      <Card className="exam-card">
        <div className="page-header">
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/teacher')}>
              返回
            </Button>
            <h2>创建新考试</h2>
          </Space>
        </div>

        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>

        <Divider />

        {steps[currentStep].content}
      </Card>
    </div>
  );
};

export default CreateExam;
