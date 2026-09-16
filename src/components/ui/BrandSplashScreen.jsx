import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function BrandSplashScreen({ onFinish }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Lock viewport scroll while curtain splash is active
    document.body.style.overflow = 'hidden';

    // Start 600ms fade-out transition at 2.6s
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      document.body.style.overflow = 'unset';
    }, 2600);

    // Complete exit sequence and trigger unmount at 3.2s
    const finishTimer = setTimeout(() => {
      document.body.style.overflow = 'unset';
      if (onFinish) onFinish();
    }, 3200);

    return () => {
      document.body.style.overflow = 'unset';
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 w-screen h-screen z-[9999] bg-[#050609] flex items-center justify-center select-none overflow-hidden transition-opacity duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
      }`}
    >
      {/* Ambient Violet/Indigo Radial Flare (Phase 1 Entrance -> Phase 2 Bloom) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.75 }}
        animate={{
          opacity: [0, 0.95, 0.8, 0],
          scale: [0.75, 1, 1.05, 1.15],
        }}
        transition={{
          duration: 3.2,
          times: [0, 0.3125, 0.75, 1], // 0.0s -> 1.0s -> 2.4s -> 3.2s
          ease: [0.16, 1, 0.3, 1],
        }}
        className="absolute w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-indigo-600/15 via-purple-500/10 to-transparent blur-[140px] pointer-events-none"
      />

      {/* Main Brand Typography Container */}
      <div className="relative z-10 flex items-center justify-center pl-[0.45em] pointer-events-none">
        <motion.div
          initial={{ opacity: 0, filter: 'blur(12px)', letterSpacing: '0.7em', scale: 0.96 }}
          animate={{
            opacity: [0, 1, 1, 0],
            filter: ['blur(12px)', 'blur(0px)', 'blur(0px)', 'blur(6px)'],
            letterSpacing: ['0.7em', '0.45em', '0.45em', '0.47em'],
            scale: [0.96, 1, 1.01, 1.03],
          }}
          transition={{
            duration: 3.2,
            times: [0, 0.3125, 0.75, 1], // Phase 1: 0-1.0s Entrance, Phase 2: 1.0-2.4s Shimmer, Phase 3: 2.4-3.2s Dissolve
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative font-sans font-bold text-4xl sm:text-6xl uppercase tracking-[0.45em] select-none flex items-center justify-center pointer-events-none"
        >
          {/* Brand Name with Accented Trailing N */}
          <span className="bg-gradient-to-b from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(255,255,255,0.12)]">
            ROVELY
          </span>
          <span className="text-indigo-400 drop-shadow-[0_0_25px_rgba(99,102,241,0.9)]">
            N
          </span>

          {/* Phase 2 Animated Angled Light Reflection Shimmer Sweep */}
          <motion.div
            initial={{ x: '-120%', opacity: 0 }}
            animate={{
              x: ['-120%', '220%'],
              opacity: [0, 0.7, 0.7, 0],
            }}
            transition={{
              duration: 1.4,
              delay: 1.0, // Triggers smoothly during Phase 2 (1.0s – 2.4s)
              ease: [0.16, 1, 0.3, 1],
            }}
            className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-25deg] pointer-events-none mix-blend-overlay"
          />
        </motion.div>
      </div>
    </div>
  );
}

export default BrandSplashScreen;
