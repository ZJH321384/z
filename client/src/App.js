import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import RoleSelect from './pages/RoleSelect';
import TeacherDashboard from './pages/TeacherDashboard';
import CreateExam from './pages/CreateExam';
import StudentDashboard from './pages/StudentDashboard';
import TakeExam from './pages/TakeExam';
import ExamResults from './pages/ExamResults';
import './App.css';

const { Header, Content } = Layout;

function App() {
  return (
    <Router>
      <Layout className="app-layout">
        <Header className="app-header">
          <h1 style={{ color: '#fff', margin: 0 }}>📝 智能考试系统</h1>
        </Header>
        <Content className="app-content">
          <Routes>
            <Route path="/" element={<RoleSelect />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/create-exam" element={<CreateExam />} />
            <Route path="/teacher/results/:examId" element={<ExamResults />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/exam/:examId" element={<TakeExam />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Router>
  );
}

export default App;
