import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

/**
 * Apple-style word-by-word reveal on scroll-in.
 */
export function WordReveal({
  text,
  className = '',
  delay = 0,
  as: Tag = 'span',
}: {
  text: string;
  className?: string;
  delay?: number;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p';
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const words = text.split(' ');

  return (
    <Tag className={className}>
      <span ref={ref} className="inline">
        {words.map((w, i) => (
          <span key={i} className="inline-block overflow-hidden align-baseline">
            <motion.span
              initial={{ y: '110%', opacity: 0 }}
              animate={inView ? { y: '0%', opacity: 1 } : {}}
              transition={{
                duration: 0.7,
                delay: delay + i * 0.06,
                ease: [0.22, 0.61, 0.36, 1],
              }}
              className="inline-block"
            >
              {w}
              {i < words.length - 1 ? '\u00A0' : ''}
            </motion.span>
          </span>
        ))}
      </span>
    </Tag>
  );
}
