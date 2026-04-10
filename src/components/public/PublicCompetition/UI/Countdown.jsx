import React, { useState, useEffect } from 'react';

const Countdown = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        setIsExpired(true);
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (isExpired) return null;

  return (
    <div className="flex gap-2 min-w-fit">
      {[
        { label: 'DANA', val: timeLeft.days },
        { label: 'SATI', val: timeLeft.hours },
        { label: 'MIN', val: timeLeft.minutes },
        { label: 'SEC', val: timeLeft.seconds }
      ].map((item, idx) => (
        <div key={idx} className="flex flex-col items-center bg-slate-800 border border-slate-700 px-2.5 py-2 rounded-lg min-w-[54px] animate-in fade-in zoom-in duration-300">
          <span className="text-xl font-black leading-none tabular-nums text-white">{item.val}</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 mt-1">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default Countdown;
