import React from 'react';

interface CalculatorKeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onClear: () => void;
  onCalculate: () => void;
}

interface Key {
  label: string;
  type: 'special' | 'operator' | 'number' | 'equal';
  val?: string;
  action?: () => void;
  isIcon?: boolean;
  rowSpan?: number;
  width?: string;
}

const CalculatorKeypad: React.FC<CalculatorKeypadProps> = ({ 
  onKeyPress, onDelete, onClear, onCalculate 
}) => {
  const keys: Key[] = [
    { label: 'C', type: 'special', action: onClear },
    { label: '÷', type: 'operator', val: '/' },
    { label: '×', type: 'operator', val: '*' },
    { label: '⌫', type: 'special', action: onDelete, isIcon: true },
    { label: '7', type: 'number', val: '7' },
    { label: '8', type: 'number', val: '8' },
    { label: '9', type: 'number', val: '9' },
    { label: '-', type: 'operator', val: '-' },
    { label: '4', type: 'number', val: '4' },
    { label: '5', type: 'number', val: '5' },
    { label: '6', type: 'number', val: '6' },
    { label: '+', type: 'operator', val: '+' },
    { label: '1', type: 'number', val: '1' },
    { label: '2', type: 'number', val: '2' },
    { label: '3', type: 'number', val: '3' },
    { label: '=', type: 'equal', action: onCalculate, rowSpan: 2 },
    { label: '0', type: 'number', val: '0', width: 'col-span-2' },
    { label: '.', type: 'number', val: '.' },
  ];

  return (
    <div className="grid grid-cols-4 grid-rows-5 gap-3 h-full select-none pb-4">
      {keys.map((key, index) => {
        // 使用 rounded-2xl 讓按鍵變為圓角方形，比之前的 rounded-[1.8rem] 更方
        let className = "keypad-btn rounded-2xl flex items-center justify-center text-2xl outline-none touch-manipulation cursor-pointer w-full h-full";
        
        if (key.type === 'operator') {
             // Dark Brownish for operators (Div, Mul, Sub, Add)
             // Matches screenshot: Brown background with Orange text
             className += " bg-[#2a1f18] text-[#d97746] font-normal"; 
        } else if (key.type === 'special') {
             // Dark background for C and Backspace, matching numbers in screenshot
             className += " bg-[#1c1c1c] text-zinc-400 font-normal";
        } else if (key.type === 'equal') {
             // Main action button (Orange)
             className += " bg-[#d95628] text-white text-4xl shadow-lg";
        } else {
             // Numbers (Dark)
             className += " bg-[#1c1c1c] text-zinc-200 font-normal";
        }

        const style: React.CSSProperties = {};
        if (key.rowSpan) style.gridRow = `span ${key.rowSpan}`;
        if (key.width === 'col-span-2') {
            style.gridColumn = 'span 2';
            // Align 0 to the left slightly to look balanced
            className = className.replace('justify-center', 'justify-start pl-9');
        }

        return (
          <button
            key={index}
            style={style}
            onClick={() => { key.action ? key.action() : onKeyPress(key.val!); }}
            className={className}
          >
            {key.isIcon ? (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                </svg>
            ) : key.label}
          </button>
        );
      })}
    </div>
  );
};

export default CalculatorKeypad;