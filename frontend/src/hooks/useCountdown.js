import { useEffect, useState } from "react";

export default function useCountdown(endTime) {
  const calculateTimeLeft = () => {
    const difference = new Date(endTime) - new Date();

    if (difference <= 0) {
      return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, formatted: "Ended", status: "Ended" };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    let formatted = "";
    if (days > 0) formatted += `${days}d `;
    formatted += `${hours}h ${minutes}m`;

    return {
      total: difference,
      days,
      hours,
      minutes,
      seconds,
      formatted,
      status: "Live"
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  return timeLeft;
}
