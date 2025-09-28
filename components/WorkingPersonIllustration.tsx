import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface WorkingPersonIllustrationProps {
  className?: string;
}

const WorkingPersonIllustration: React.FC<WorkingPersonIllustrationProps> = ({ className = "max-w-[80%] my-5" }) => {
  const [isTyping, setIsTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isWorking, setIsWorking] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const { t } = useLanguage();

  // Simulate typing animation
  useEffect(() => {
    const typingInterval = setInterval(() => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);
    }, 4000);

    return () => clearInterval(typingInterval);
  }, []);

  // Simulate thinking animation
  useEffect(() => {
    const thinkingInterval = setInterval(() => {
      setIsThinking(true);
      setTimeout(() => setIsThinking(false), 1500);
    }, 6000);

    return () => clearInterval(thinkingInterval);
  }, []);

  // Simulate working state changes
  useEffect(() => {
    const workingInterval = setInterval(() => {
      setIsWorking(prev => !prev);
    }, 8000);

    return () => clearInterval(workingInterval);
  }, []);

  return (
    <div className="relative cursor-pointer ml-8"
         onMouseEnter={() => setIsHovered(true)}
         onMouseLeave={() => setIsHovered(false)}
         onClick={() => {
           setIsClicked(true);
           setShowMessage(true);
           setTimeout(() => setIsClicked(false), 1000);
           setTimeout(() => setShowMessage(false), 3000); // Hide message after 3 seconds
         }}>
      {/* Main illustration */}
      <img 
        src="/images/logo orang duduk.png" 
        alt="Person working illustration" 
        className={`${className} transition-all duration-500 ${
          isClicked ? 'animate-stretch-person' :
          isHovered ? 'animate-focus-person' :
          isTyping ? 'animate-typing' : 
          isThinking ? 'animate-thinking-person' : 
          isWorking ? 'animate-working' : 'animate-idle-person'
        }`}
      />
      
      {/* Typing indicator dots */}
      {isTyping && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      )}
      
      {/* Thinking bubble */}
      {isThinking && (
        <div className="absolute top-8 right-8">
          <div className="bg-white rounded-full p-2 shadow-lg animate-thinking-bubble">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-100"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-200"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Working indicator */}
      {isWorking && (
        <div className="absolute bottom-4 left-4">
          <div className="bg-green-400 text-white text-xs px-2 py-1 rounded-full animate-pulse">
            Working...
          </div>
        </div>
      )}
      
      {/* Floating elements around the person */}
      <div className="absolute -top-2 -left-2 w-3 h-3 bg-yellow-300 rounded-full animate-float-person opacity-70"></div>
      <div className="absolute -bottom-2 -right-2 w-2 h-2 bg-blue-300 rounded-full animate-float-person-delayed opacity-70"></div>
      <div className="absolute top-1/3 -right-4 w-2 h-2 bg-green-300 rounded-full animate-float-person-slow opacity-70"></div>
      
      {/* Sparkle effects */}
      <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-yellow-400 rounded-full animate-sparkle-person"></div>
      <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-yellow-300 rounded-full animate-sparkle-person-delayed"></div>
      
      {/* Interactive hover effects */}
      {isHovered && (
        <>
          <div className="absolute top-4 right-4 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
          <div className="absolute bottom-4 left-4 w-2 h-2 bg-blue-400 rounded-full animate-ping delay-300"></div>
        </>
      )}
      
      {/* Click effect */}
      {isClicked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 border-4 border-green-400 rounded-full animate-ping opacity-75"></div>
        </div>
      )}
      
      {/* Breathing effect overlay */}
      <div className="absolute inset-0 animate-breathing-person opacity-0 pointer-events-none"></div>
      
      {/* Click Message */}
      {showMessage && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 z-50">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl shadow-xl border-2 border-white animate-message-fade-in-scale animate-message-glow">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <span className="text-cyan-500 text-lg">🤖</span>
              </div>
              <div className="text-sm font-semibold text-center">
                {t('ai.clickMessage')}
              </div>
            </div>
            {/* Arrow pointing down */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-cyan-500"></div>
            </div>
            {/* Sparkle effects around message */}
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-sparkle"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-sparkle-delayed"></div>
            <div className="absolute top-1/2 -right-2 w-1 h-1 bg-white rounded-full animate-sparkle-slow"></div>
            <div className="absolute top-1/2 -left-2 w-1 h-1 bg-white rounded-full animate-sparkle"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkingPersonIllustration;
