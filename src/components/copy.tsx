import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy } from "lucide-react";

type Props = {
  textToCopy: string;
};

const truncateAddress = (address: string, startLength = 3, endLength = 4) => {
  if (address.length <= startLength + endLength) {
    return address;
  }
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

export const CopyToClipboard = ({ textToCopy }: Props) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      // Using document.execCommand('copy') for clipboard operations due to iFrame restrictions
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
      // Optionally, show a user-friendly message if copy fails
    }
  }, [textToCopy]);

  return (
    <div className="absolute top-[6px] right-[6px] z-50">
      <div className="flex items-center gap-2">
        {/* X link moved to the left */}
        <a 
          href="https://x.com/compainionfun" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            transition: 'opacity 0.3s ease',
            opacity: 1
          }}
        >
          <img 
            src="x.png" 
            alt="Follow @compainionfun on Twitter" 
            style={{ width: '12px', height: '12px' }}
          />
        </a>
        
        {/* Copy button */}
        <motion.button
          className="flex items-center justify-center p-4 rounded-md focus:outline-none bg-gray-800 text-[#414141] text-[10px]"
          onClick={handleCopy}
          whileTap={{ scale: 0.95 }}
        >
          <div className="flex items-center p-2">
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Check size={12} />
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Copy size={12} />
                </motion.div>
              )}
            </AnimatePresence>
            {/* Added inline style for margin-left to create space */}
            <span style={{ marginLeft: '4px' }}>
              {truncateAddress(textToCopy)}
            </span>
          </div>
        </motion.button>
      </div>
    </div>
  );
};