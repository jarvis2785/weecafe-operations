"use client";

import { motion } from "framer-motion";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

interface PinPadProps {
  pin: string;
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  shake: boolean;
  disabled?: boolean;
}

export default function PinPad({ pin, onDigit, onBackspace, shake, disabled }: PinPadProps) {
  return (
    <motion.div
      className="flex flex-col items-center gap-10"
      animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : { x: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex gap-5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-[18px] w-[18px] rounded-full border-2 border-cream transition-colors duration-200 ${
              i < pin.length ? "bg-cream" : "bg-transparent"
            } ${shake ? "animate-flash-pink" : ""}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {KEYS.map((key, idx) => {
          if (key === "") return <div key={idx} className="h-[76px] w-[76px]" />;
          if (key === "back") {
            return (
              <button
                key={idx}
                type="button"
                disabled={disabled}
                onClick={onBackspace}
                className="flex h-[76px] w-[76px] items-center justify-center rounded-2xl text-2xl text-cream/70 transition-all duration-150 ease active:scale-95 active:bg-white/20 disabled:opacity-40"
              >
                ⌫
              </button>
            );
          }
          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => onDigit(key)}
              className="flex h-[76px] w-[76px] items-center justify-center rounded-2xl bg-white/10 text-2xl font-medium text-cream transition-all duration-150 ease hover:bg-white/20 active:scale-95 active:bg-white/20 disabled:opacity-40"
            >
              {key}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
