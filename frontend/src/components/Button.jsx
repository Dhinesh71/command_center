import { motion } from 'framer-motion';

export default function Button({
  children,
  variant = 'primary',
  onClick,
  className = '',
  type = 'button',
  ...props
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-brand-purple to-brand-pink text-white shadow-lg hover:shadow-glow btn-ripple font-semibold',
    outline: 'border-2 border-transparent bg-clip-padding relative before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-r before:from-brand-purple before:to-brand-pink before:rounded-xl hover:text-white hover:bg-gradient-to-r hover:from-brand-purple hover:to-brand-pink font-semibold',
    secondary: 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-md font-medium',
    ghost: 'bg-transparent text-brand-purple hover:bg-gradient-to-r hover:from-brand-purple/10 hover:to-brand-pink/10 font-medium',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      className={`px-6 py-3 rounded-xl transition-all duration-300 ${variants[variant]} ${className}`}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
