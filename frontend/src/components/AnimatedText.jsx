import { motion } from 'framer-motion';

export default function AnimatedText({ text, className = '', gradient = false, stagger = false }) {
  if (!stagger) {
    return (
      <motion.h1
        className={`${gradient ? 'animated-gradient-text' : ''} ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {text}
      </motion.h1>
    );
  }

  const words = text.split(' ');

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const child = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.h1
      className={`${gradient ? 'animated-gradient-text' : ''} ${className}`}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => (
        <motion.span key={index} variants={child} className="inline-block mr-2">
          {word}
        </motion.span>
      ))}
    </motion.h1>
  );
}
