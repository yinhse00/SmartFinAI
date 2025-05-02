
import { AnimatePresence, motion } from 'framer-motion';
import { Loader } from 'lucide-react';

interface ProcessingOverlayProps {
  currentStep: string;
  stepProgress: string;
  isChineseInterface?: boolean;
}

const ProcessingOverlay = ({ 
  currentStep, 
  stepProgress, 
  isChineseInterface = false 
}: ProcessingOverlayProps) => {
  // Get the appropriate step label based on the current step and language
  const getStepLabel = () => {
    if (isChineseInterface) {
      switch(currentStep) {
        case 'initial': return '正在初始化...';
        case 'reviewing': return '正在检索数据...';
        case 'listingRules': return '分析上市规则...';
        case 'takeoversCode': return '分析收购守则...';
        case 'execution': return '处理查询...';
        case 'processing': return '生成全面回复...';
        case 'finalizing': return '完善回复中...';
        case 'response': return '准备最终回复...';
        default: return '处理中...';
      }
    } else {
      switch(currentStep) {
        case 'initial': return 'Initializing...';
        case 'reviewing': return 'Reviewing data...';
        case 'listingRules': return 'Analyzing listing rules...';
        case 'takeoversCode': return 'Processing takeovers code...';
        case 'execution': return 'Executing query...';
        case 'processing': return 'Generating comprehensive response...';
        case 'finalizing': return 'Finalizing response...';
        case 'response': return 'Preparing final response...';
        default: return 'Processing...';
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed bottom-[86px] right-6 bg-finance-medium-blue text-white py-2 px-4 rounded-lg shadow-lg z-50 flex items-center gap-3 min-w-[200px]"
      >
        <Loader className="h-4 w-4 animate-spin" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">{getStepLabel()}</span>
          {stepProgress && (
            <span className="text-xs text-finance-light-blue">{stepProgress}</span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProcessingOverlay;
