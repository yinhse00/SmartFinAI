
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
  console.log('=== DEBUGGING formatConsiderationAmount ===');
  console.log('Input amount:', amount, 'Currency:', currency);
  
  if (amount >= 1000000000) {
    const billions = (amount / 1000000000).toFixed(1);
    console.log('Billions calculation:', amount, '/ 1000000000 =', billions);
    return `${currency} ${billions}B`;
  } else if (amount >= 1000000) {
    const millions = Math.round(amount / 1000000);
    console.log('Millions calculation:', amount, '/ 1000000 =', millions);
    return `${currency} ${millions}M`;
  } else if (amount >= 1000) {
    const thousands = Math.round(amount / 1000);
    console.log('Thousands calculation:', amount, '/ 1000 =', thousands);
    return `${currency} ${thousands}K`;
  } else {
    console.log('No formatting needed, returning:', amount);
    return `${currency} ${amount}`;
  }
};
