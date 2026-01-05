import { motion } from 'framer-motion';

export default function AdminComingSoon({ title, icon, description }) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center max-w-md"
            >
                <div className="text-8xl mb-6">{icon}</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
                <p className="text-gray-600 mb-6">{description}</p>
                <div className="inline-block px-6 py-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                    <p className="text-purple-700 font-medium">🚧 Feature Under Development</p>
                </div>
            </motion.div>
        </div>
    );
}
