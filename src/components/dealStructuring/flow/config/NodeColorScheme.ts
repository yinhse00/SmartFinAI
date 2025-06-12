
export type EntityGroup = 'acquirer' | 'target' | 'neutral';

export const getNodeColors = (type: string, entityGroup: EntityGroup) => {
  switch (type) {
    case 'target':
      return {
        backgroundColor: '#fef3c7',
        borderColor: '#f59e0b'
      };
    case 'buyer':
      return {
        backgroundColor: '#dbeafe',
        borderColor: '#2563eb'
      };
    case 'stockholder':
      if (entityGroup === 'acquirer') {
        return {
          backgroundColor: '#e0f2fe',
          borderColor: '#0284c7'
        };
      } else {
        return {
          backgroundColor: '#fef3c7',
          borderColor: '#f59e0b'
        };
      }
    case 'consideration':
      return {
        backgroundColor: '#f0fdf4',
        borderColor: '#16a34a'
      };
    case 'subsidiary':
      return {
        backgroundColor: '#f3e8ff',
        borderColor: '#9333ea'
      };
    default:
      return {
        backgroundColor: '#f3f4f6',
        borderColor: '#6b7280'
      };
  }
};
