import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to detect if an element is in view using native IntersectionObserver.
 * @param {Object} options - IntersectionObserver options
 * @returns {[Function, boolean]} - [ref callback, inView status]
 */
export function useInView(options = {}) {
  const [inView, setInView] = useState(false);
  const [node, setNode] = useState(null);

  const ref = useCallback((newNode) => {
    setNode(newNode);
  }, []);

  useEffect(() => {
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    }, options);

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [node, options.root, options.rootMargin, options.threshold]);

  return [ref, inView];
}
