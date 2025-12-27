import React, { useRef } from 'react';

interface CalculatorKeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onClear: () => void;
  onCalculate: () => void;
}

const CalculatorKeypad: React.FC<CalculatorKeypadProps> = ({ 
  onKeyPress, 
  onDelete, 
  onClear,
  onCalculate 
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

  // Helper function to create ripple effect
  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    
    // Create span element
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    const rect = button.getBoundingClientRect();
    
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.classList.add("ripple");

    // Remove existing ripples to keep DOM clean? 
    // Actually, letting them stack looks better for rapid clicks, just remove after animation.
    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) {
      ripple.remove();
    }

    button.appendChild(circle);
    
    // Clean up after animation
    setTimeout(() => {
      circle.remove();
    }, 600);
  };

  return (
    <div className="grid grid-cols-4 gap-3 px-2 select-none">
      {keys.map((key, index) => {
        let className = "glass-keypad-btn h-14 sm:h-16 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-light outline-none touch-manipulation cursor-pointer select-none";
        
        if (key.type === 'operator') {
          className += " glass-keypad-operator"; 
        } else if (key.type === 'function') {
          className += " text-zinc-500 text-lg";
        } else if (key.type === 'equal') {
          className = "glass-keypad-btn glass-keypad-action h-full rounded-2xl flex items-center justify-center text-2xl font-normal text-white row-start-4 row-end-6 col-start-4 outline-none cursor-pointer";
        } else if (key.width) {
          className += ` ${key.width}`;
        } else {
           className += " text-zinc-200";
        }

        return (
          <button
            key={index}
            onClick={(e) => {
              createRipple(e);
              // Small delay on action to let the visual feedback register? 
              // No, instant response feels faster.
              if (key.action) key.action();
              else if (key.val) onKeyPress(key.val);
            }}
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