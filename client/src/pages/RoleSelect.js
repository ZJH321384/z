import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'antd';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';

const RoleSelect = () => {
  const navigate = useNavigate();

  return (
    <div className="role-select-container">
      <Card
        className="role-card teacher-role"
        onClick={() => navigate('/teacher')}
      >
        <UserOutlined className="role-icon" />
        <h2 className="role-title">教师端</h2>
        <p className="role-desc">
          创建考试、设置科目和难度<br />
          自动生成题目，实时查看考试结果
        </p>
      </Card>

      <Card
        className="role-card student-role"
        onClick={() => navigate('/student')}
      >
        <TeamOutlined className="role-icon" />
        <h2 className="role-title">学生端</h2>
        <p className="role-desc">
          加入考试、在线答题<br />
          支持客观题和主观题图片上传
        </p>
      </Card>
    </div>
  );
};

export default RoleSelect;
