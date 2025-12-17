import { Switch } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';
import { useAppStore } from '../store/appStore';

export function ThemeToggle() {
  const { theme, toggleTheme } = useAppStore();
  const isDark = theme === 'dark';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <BulbOutlined 
        style={{ 
          fontSize: '16px',
          color: isDark ? '#8c8c8c' : '#faad14'
        }} 
      />
      <Switch
        checked={isDark}
        onChange={toggleTheme}
        checkedChildren="深色"
        unCheckedChildren="浅色"
      />
      <BulbFilled 
        style={{ 
          fontSize: '16px',
          color: isDark ? '#fff' : '#8c8c8c'
        }} 
      />
    </div>
  );
}

