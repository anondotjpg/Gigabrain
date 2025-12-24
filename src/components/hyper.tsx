import React, { useState, useEffect } from 'react';

interface HyperTextProps {
  text: string;
  className?: string;
  animationDuration?: number;
  scrambleChars?: string;
}

const HyperText: React.FC<HyperTextProps> = ({ 
  text, 
  className = "",
  animationDuration = 3000,
  scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
}) => {
  const [displayText, setDisplayText] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const chars = text.split("");
    let iterations = 0;
    
    const interval = setInterval(() => {
      setDisplayText(
        chars
          .map((char, index) => {
            if (index < iterations) {
              return char;
            }
            return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
          })
          .join("")
      );
      
      if (iterations >= text.length) {
        clearInterval(interval);
        setIsAnimating(false);
      }
      
      iterations += 1 / 3;
    }, 30);
    
    return () => clearInterval(interval);
  }, [text, scrambleChars]);

  return (
    <div 
      className={`absolute top-[5px] left-[5px] z-[1px] ${className}`}
    >
      <div className="text-white px-4 py-2">
        <span 
          className="font-mono text-xl font-bold whitespace-nowrap"
        >
          {displayText}
        </span>
    
      </div>
    </div>
  );
};

// Main component showcasing the HyperText
const HyperTextDemo: React.FC = () => {
  return (
    <HyperText 
      text="Pump-San v0.1"
    />
  );
};

export default HyperTextDemo;