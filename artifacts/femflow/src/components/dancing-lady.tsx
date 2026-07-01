import { motion } from "framer-motion";

export function DancingLady({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className={className}
      style={{ transformOrigin: "12px 21px" }}
      initial={false}
      animate={{ rotate: [-11, 11, -11], y: [0, -1.4, 0] }}
      transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    >
      {/* head */}
      <circle cx="12" cy="3.6" r="2.1" fill="currentColor" />
      {/* arms raised up in a V + legs in a dance pose */}
      <path
        d="M11 8 L7.5 4.3 M13 8 L16.5 4.3 M10.6 16.5 L8.7 21 M13.4 16.5 L15.8 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* flared dress */}
      <path d="M11 7.4 L13 7.4 L15.6 16.8 L8.4 16.8 Z" fill="currentColor" />
    </motion.svg>
  );
}
