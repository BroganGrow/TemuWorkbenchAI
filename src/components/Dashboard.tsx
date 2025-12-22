import { Card, Statistic, Row, Col, Button, Space, Typography } from 'antd';
import { 
  ThunderboltOutlined, 
  EditOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  FolderOutlined,
  PlusOutlined,
  FolderOpenOutlined,
  InboxOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import { CATEGORIES } from './Sidebar';

const { Title, Text } = Typography;

export function Dashboard() {
  const { products, setCurrentCategory, rootPath } = useAppStore();

  // 统计各个状态的产品数量
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIES.forEach(cat => {
      if (cat.key !== 'Dashboard' && cat.key !== '00_Assets' && cat.key !== '10_Trash') {
        counts[cat.key] = products.filter(p => p.category === cat.key).length;
      }
    });
    return counts;
  }, [products]);

  // 总产品数（不包含素材库和垃圾筒）
  const totalProducts = products.filter(p => p.category !== '00_Assets' && p.category !== '10_Trash').length;

  // 最近编辑/创建的产品（取前5个，不包含垃圾筒）
  const recentProducts = [...products]
    .filter(p => p.category !== '00_Assets' && p.category !== '10_Trash')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const handleOpenFolder = async () => {
    if (window.electronAPI?.showInFolder) {
      await window.electronAPI.showInFolder(rootPath);
    }
  };

  return (
    <div style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0, color: 'var(--text-primary)' }}>控制台</Title>
          <Text type="secondary">欢迎回来！这里是您的工作概览。</Text>
        </div>
        <Space>
          <Button icon={<FolderOpenOutlined />} onClick={handleOpenFolder}>打开根目录</Button>
        </Space>
      </div>

      {/* 核心指标 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card bordered={false} style={{ background: 'var(--card-bg)' }}>
            <Statistic 
              title="总产品数" 
              value={totalProducts} 
              prefix={<InboxOutlined />} 
              valueStyle={{ color: 'var(--text-primary)' }}
            />
          </Card>
        </Col>
        <Col span={18}>
          <Card bordered={false} style={{ background: 'var(--card-bg)' }}>
            <Row gutter={16}>
              <Col span={4}>
                <Statistic 
                  title="选品中" 
                  value={stats['01_In_Progress'] || 0} 
                  valueStyle={{ color: '#ff9c5a' }}
                  prefix={<ThunderboltOutlined />}
                />
              </Col>
              <Col span={4}>
                <Statistic 
                  title="制作中" 
                  value={stats['02_Listing'] || 0} 
                  valueStyle={{ color: '#fd7a45' }}
                  prefix={<EditOutlined />}
                />
              </Col>
              <Col span={4}>
                <Statistic 
                  title="待发货" 
                  value={stats['03_Waiting'] || 0} 
                  valueStyle={{ color: '#9e7aff' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col span={4}>
                <Statistic 
                  title="已上架" 
                  value={stats['04_Active'] || 0} 
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={4}>
                <Statistic 
                  title="已下架" 
                  value={stats['05_Archive'] || 0} 
                  valueStyle={{ color: '#595959' }}
                  prefix={<FolderOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* 快捷入口 */}
        <Col span={8}>
          <Card title="快捷入口" bordered={false} style={{ background: 'var(--card-bg)', height: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Button type="primary" block icon={<PlusOutlined />} onClick={() => document.getElementById('new-product-btn')?.click()} style={{ height: '48px', fontSize: '16px' }}>
                新建产品
              </Button>
              <Button block icon={<InboxOutlined />} onClick={() => setCurrentCategory('00_Assets')} style={{ height: '40px' }}>
                浏览公共素材库
              </Button>
              <Button block icon={<ThunderboltOutlined />} onClick={() => setCurrentCategory('01_In_Progress')} style={{ height: '40px' }}>
                查看选品中产品
              </Button>
            </Space>
          </Card>
        </Col>

        {/* 最近添加 */}
        <Col span={16}>
          <Card title="最近添加的产品" bordered={false} style={{ background: 'var(--card-bg)', height: '100%' }}>
            {recentProducts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentProducts.map(product => (
                  <div 
                    key={product.id}
                    style={{ 
                      padding: '12px', 
                      borderRadius: '8px', 
                      background: 'var(--bg-tertiary)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setCurrentCategory(product.category);
                      useAppStore.getState().setSelectedProduct(product.id);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '6px', 
                        background: 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                      }}>
                        {product.type === 'ST' ? '👕' : '📦'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{product.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {product.id} · {new Date(product.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-secondary)',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {CATEGORIES.find(c => c.key === product.category)?.label}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                暂无产品记录
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

import { useMemo } from 'react';

