import { motion } from 'framer-motion';
import { useState } from 'react';

export default function Card({ children, className = '', interactive = true, glass = false, ...props }) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e) => {
    if (!interactive) return;

    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateXValue = ((y - centerY) / centerY) * -3;
    const rotateYValue = ((x - centerX) / centerX) * 3;

    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const baseClasses = glass
    ? 'glass-card rounded-2xl'
    : 'bg-white rounded-2xl shadow-premium';

  return (
    <motion.div
      className={`overflow-hidden transition-all duration-300 ${baseClasses} ${className}`}
      style={{
        transform: interactive ? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)` : 'none',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={interactive ? { y: -6, boxShadow: '0 16px 48px rgba(108, 75, 255, 0.20)' } : {}}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
