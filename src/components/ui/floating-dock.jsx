import React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export const FloatingDock = ({ items }) => {
  let mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="mx-auto flex h-16 items-center gap-3 rounded-full bg-[#0a0a12]/80 backdrop-blur-2xl border border-white/10 px-4 shadow-2xl"
    >
      {items.map((item) => (
        <DockIcon key={item.id || item.title} mouseX={mouseX} {...item} />
      ))}
    </motion.div>
  );
};

function DockIcon({ mouseX, title, icon, onClick, badge, isRunning, isActive }) {
  let ref = React.useRef(null);

  let distance = useTransform(mouseX, (val) => {
    let bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  let widthSync = useTransform(distance, [-150, 0, 150], [40, 56, 40]);
  let width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <motion.button
      ref={ref}
      style={{ width, height: width }}
      onClick={(e) => {
        e.preventDefault();
        if (onClick) onClick();
      }}
      title={title}
      className={`relative flex aspect-square items-center justify-center rounded-full transition-colors cursor-pointer ${
        isRunning
          ? 'bg-indigo-600/30 border border-indigo-400/60 shadow-[0_0_15px_rgba(99,102,241,0.5)]'
          : isActive
          ? 'bg-white/15 border border-white/30'
          : 'bg-white/5 border border-white/10 hover:border-white/25'
      }`}
    >
      <div className="h-5 w-5 flex items-center justify-center">{icon}</div>

      {badge && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2.5 -right-2 px-1.5 py-0.5 rounded-full bg-indigo-600 border border-indigo-300 text-[9px] font-mono font-bold text-white shadow-[0_0_10px_rgba(99,102,241,0.6)] flex items-center gap-1 z-20 pointer-events-none whitespace-nowrap"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{badge}</span>
        </motion.div>
      )}
    </motion.button>
  );
}

export default FloatingDock;
