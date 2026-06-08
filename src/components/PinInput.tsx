import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

interface Props { onComplete: (pin: string) => void; }

export function PinInput({ onComplete }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));

  const handleChange = (index: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[index] = val;
    setDigits(next);
    if (val && index < 5) refs.current[index + 1]?.focus();
    if (next.every(Boolean)) onComplete(next.join(''));
  };

  const handleKeyDown = (_index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      setDigits(Array(6).fill(''));
      refs.current[0]?.focus();
    }
  };

  return (
    <div className="flex gap-2">
      {digits.map((digit, i) => (
        <Input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={digit}
          maxLength={1}
          className="w-10 text-center px-0"
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}
