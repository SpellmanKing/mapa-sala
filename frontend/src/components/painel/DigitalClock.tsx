import React, { useState, useEffect } from 'react';

interface DigitalClockProps {
  variant?: 'tv' | 'default';
}

const formatHoraBrasilia = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  return new Intl.DateTimeFormat('pt-BR', options).format(date);
};

export const DigitalClock: React.FC<DigitalClockProps> = ({ variant = 'default' }) => {
  const [horaAtual, setHoraAtual] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setHoraAtual(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (variant === 'tv') {
    return (
      <div className="flex items-center gap-3 bg-primary/5 dark:bg-primary/10 border border-primary/15 px-4 py-2.5 rounded-xl text-primary shadow-xs">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
        <span className="font-mono text-sm font-black tracking-wider">
          {formatHoraBrasilia(horaAtual)}
        </span>
        <span className="text-[10px] font-black uppercase bg-primary text-white px-2 py-0.5 rounded-md tracking-wider">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 bg-primary/5 dark:bg-primary/10 border border-primary/15 px-3.5 py-2 rounded-xl text-primary shadow-xs">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
      </span>
      <span className="font-mono text-xs font-black tracking-wider">
        {formatHoraBrasilia(horaAtual)}
      </span>
      <span className="text-[9px] font-black uppercase bg-primary text-white px-1.5 py-0.5 rounded-md tracking-widest">
        Brasília
      </span>
    </div>
  );
};
