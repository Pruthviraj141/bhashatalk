import { motion } from 'framer-motion'

export function TypingDots() {
  return (
    <div className="mb-2 flex w-full justify-start">
      <div className="chat-bubble-in rounded-3xl rounded-bl-md px-3.5 py-2.5">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((index) => (
            <motion.span
              key={index}
              className="h-1.5 w-1.5 rounded-full bg-slate-500 dark:bg-slate-400"
              animate={{ y: [0, -3, 0], opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 0.8,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
                delay: index * 0.12,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
