import { motion } from "framer-motion";

const FloatingShape = ( {color, size, top, left, delay}) => {
  return (
    <motion.div
		className={`absolute ${size} rounded-full opacity-100 blur-2xl`}
                style={{
                top,
                left,
                background: `radial-gradient(circle, #ecb232 0%, #99452e 100%)`,
            }}
			animate={{
				y: ["0%", "100%", "0%"],
				x: ["0%", "100%", "0%"],
				rotate: [0, 360],
			}}
			transition={{
				duration: 20,
				ease: "linear",
				repeat: Infinity,
				delay,
			}}
			aria-hidden='true'
		/>
  );
};

export default FloatingShape;