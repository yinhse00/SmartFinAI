
export const getNodeColors = (type: string, ownership?: number) => {
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
      if (ownership && ownership > 50) {
        return {
          backgroundColor: '#dbeafe',
          borderColor: '#2563eb'
        };
      }
      return {
        backgroundColor: '#f3f4f6',
        borderColor: '#6b7280'
      };
    case 'consideration':
      return {
        backgroundColor: '#f0fdf4',
        borderColor: '#16a34a'
      };
    default:
      return {
        backgroundColor: '#f3f4f6',
        borderColor: '#6b7280'
      };
  }
};

export const formatConsiderationAmount = (amount: number, currency: string): string => {
  console.log('Formatting amount:', amount, 'Currency:', currency);
  
  if (amount >= 1000000000) {
    const billions = (amount / 1000000000).toFixed(1);
    return `${currency} ${billions}B`;
  } else if (amount >= 1000000) {
    const millions = Math.round(amount / 1000000);
    return `${currency} ${millions}M`;
  } else if (amount >= 1000) {
    const thousands = Math.round(amount / 1000);
    return `${currency} ${thousands}K`;
  } else {
    return `${currency} ${amount}`;
  }
};
