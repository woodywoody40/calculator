import React from 'react';

interface CalculatorKeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onClear: () => void;
  onCalculate: () => void;
}

const CalculatorKeypad: React.FC<CalculatorKeypadProps> = ({ 
  onKeyPress, onDelete, onClear, onCalculate 
}) => {
  const keys = [
    { label: 'C', type: 'function', action: onClear },
    { label: '÷', type: 'operator', val: '/' },
    { label: '×', type: 'operator', val: '*' },
    { label: '⌫', type: 'function', action: onDelete },
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

  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    const rect = button.getBoundingClientRect();
    const circle = document.createElement("span");
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.classList.add("ripple");
    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) ripple.remove();
    button.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  };

  return (
    <div className="grid grid-cols-4 grid-rows-5 gap-3 h-full select-none">
      {keys.map((key, index) => {
        let className = "glass-keypad-btn rounded-2xl flex items-center justify-center text-2xl font-light outline-none touch-manipulation cursor-pointer w-full h-full shadow-lg";
        
        if (key.type === 'operator') className += " glass-keypad-operator font-medium text-xl"; 
        else if (key.type === 'function') className += " text-zinc-600 text-lg font-medium";
        else if (key.type === 'equal') className = "glass-keypad-btn glass-keypad-action rounded-[1.8rem] flex items-center justify-center text-4xl outline-none cursor-pointer w-full h-full shadow-2xl transition-all active:scale-95";
        else className += " text-zinc-300 font-medium";

        const style: React.CSSProperties = {};
        if (key.rowSpan) style.gridRow = `span ${key.rowSpan}`;
        if (key.width === 'col-span-2') style.gridColumn = 'span 2';

        return (
          <button
            key={index}
            style={style}
            onClick={(e) => { createRipple(e); key.action ? key.action() : onKeyPress(key.val!); }}
            className={className}
          >
            {key.label}
          </button>
        );
      })}
    </div>
  );
};

export default CalculatorKeypad;