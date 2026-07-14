"use client";

import { AnimatePresence, motion, PanInfo } from "framer-motion";

interface SwipeableCategoryPanelProps {
  categoryKey: string;
  direction: number;
  onSwipePrev: () => void;
  onSwipeNext: () => void;
  children: React.ReactNode;
}

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

const SWIPE_THRESHOLD = 60;

export default function SwipeableCategoryPanel({
  categoryKey,
  direction,
  onSwipePrev,
  onSwipeNext,
  children,
}: SwipeableCategoryPanelProps) {
  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x <= -SWIPE_THRESHOLD) {
      onSwipeNext();
    } else if (info.offset.x >= SWIPE_THRESHOLD) {
      onSwipePrev();
    }
  }

  return (
    <div className="overflow-x-hidden">
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={categoryKey}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2, ease: "easeOut" }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="flex flex-col gap-3"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
