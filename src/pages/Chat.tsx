
import MainLayout from '@/components/layout/MainLayout';
import ChatInterface from '@/components/chat/ChatInterface';

const Chat = () => {
  return (
    <MainLayout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-finance-dark-blue dark:text-white">Regulatory Assistant</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Ask questions about Hong Kong listing rules, takeovers code, and compliance requirements
        </p>
      </div>
      
      <ChatInterface />
    </MainLayout>
  );
};

export default Chat;
