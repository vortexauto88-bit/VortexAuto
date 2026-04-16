import { motion, useInView } from 'framer-motion';
import { PropsWithChildren, useRef } from 'react';

export function Reveal({
  children, delay = 0, y = 24,
}: PropsWithChildren<{ delay?: number; y?: number }>) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
