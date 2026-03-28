import { useEffect, useState } from "react";

export default function useBlink(interval = 800) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(prev => !prev);
    }, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return visible;
}
