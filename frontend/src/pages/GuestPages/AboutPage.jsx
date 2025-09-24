
import Footer from "../../components/Footer.jsx";
import { LucideAward, LucideHeart, LucideRocket, LucideShield, LucideUsers, LucideTrendingUp, LucideTag, LucideTruck, LucideWarehouse, LucideCrown } from "lucide-react";
import { motion } from "framer-motion";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-[#fffefc]">
      {/* Hero Section */}
      <motion.section 
        className="pt-32 pb-16 bg-[#901414]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1 
              className="text-5xl md:text-6xl font-bold text-white mb-6 font-libre"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              About Rosel
            </motion.h1>
            <motion.p 
              className="text-xl text-white leading-relaxed font-alice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Your trusted partner in premium frozen meat products
            </motion.p>
          </div>
        </div>
      </motion.section>

      {/* Company Story Section */}
      <motion.section 
        className="py-16 bg-[#f8f3ed]"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <motion.div 
                className="flex justify-center mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <img 
                  src="/rosellogo.png" 
                  alt="Rosel Logo" 
                  className="h-50 w-72 drop-shadow-md" 
                />
              </motion.div>
              <motion.h2 
                className="text-4xl font-bold text-[#860809] mb-6 font-libre"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                  Our Story
              </motion.h2>
              <motion.div 
                className="max-w-4xl mx-auto space-y-6 text-[#030105] leading-relaxed text-lg font-alice"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <p>
                  Founded in 2021, Rosel Frozen Meat Products Trading began with a simple yet powerful mission: 
                    to provide the highest quality frozen meat products to families and businesses across 
                    the Philippines. Since our establishment, we have been committed to delivering 
                    premium quality meat that meets the highest standards of food safety and freshness.
                  </p>
                  <p>
                  Our journey started with the vision of making premium frozen meat accessible to everyone, 
                    ensuring that every customer receives products that are not only delicious but also 
                    safe, nutritious, and sourced from the most reliable suppliers in the industry.
                  </p>
                  <p>
                    Today, we continue to uphold our founding principles while embracing innovation and 
                    technology to better serve our customers and maintain our position as a trusted leader 
                  in the frozen meat industry. Our commitment to excellence has made us a preferred choice 
                  for customers who value quality, reliability, and exceptional service.
                </p>
              </motion.div>
              </div>
            </div>
          </div>
      </motion.section>

      {/* Values Section */}
      <motion.section 
        className="py-16 bg-[#fffefc]"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.h2 
              className="text-4xl font-bold text-[#860809] text-center mb-12 font-libre"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Our Core Values
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div 
                className="text-center bg-[#f8f3ed] p-8 rounded-xl shadow-lg"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="w-16 h-16 bg-[#860809] rounded-full flex items-center justify-center mx-auto mb-4">
                  <LucideAward className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#a31f17] mb-4 font-alice">Quality First</h3>
                <p className="text-[#030105] font-libre">
                  We never compromise on quality. Every product undergoes rigorous quality checks 
                  to ensure it meets our high standards.
                </p>
              </motion.div>
              <motion.div 
                className="text-center bg-[#f8f3ed] p-8 rounded-xl shadow-lg"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="w-16 h-16 bg-[#860809] rounded-full flex items-center justify-center mx-auto mb-4">
                  <LucideHeart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#a31f17] mb-4 font-alice">Customer Trust</h3>
                <p className="text-[#030105] font-libre">
                  Building lasting relationships through transparency, reliability, and exceptional 
                  customer service.
                </p>
              </motion.div>
              <motion.div 
                className="text-center bg-[#f8f3ed] p-8 rounded-xl shadow-lg"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="w-16 h-16 bg-[#860809] rounded-full flex items-center justify-center mx-auto mb-4">
                  <LucideRocket className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#a31f17] mb-4 font-alice">Innovation</h3>
                <p className="text-[#030105] font-libre">
                  Continuously improving our processes and services to better meet the evolving 
                  needs of our customers.
                </p>
              </motion.div>
              </div>
            </div>
          </div>
      </motion.section>

      {/* Premium Brands Section */}
      <motion.section 
        className="py-16 bg-[#f8f3ed]"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.h2 
              className="text-4xl font-bold text-[#860809] text-center mb-12 font-libre"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Premium Brands
            </motion.h2>
            <div className="relative overflow-hidden w-full">
              <div className="animate-scroll py-4" style={{ gap: '2rem' }}>
                {/* First set of brand logos */}
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/ajclg.png" alt="AJC" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/alliancelg.png" alt="Alliance" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/amecolg.png" alt="Ameco" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/auroralg.png" alt="Aurora" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/casinolg.png" alt="Casino" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/copacollg.png" alt="Copacol" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/excellg.png" alt="Excel" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/fieldalelg.png" alt="Fieldale" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/friboilg.png" alt="Friboi" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/hatfieldlg.png" alt="Hatfield" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/inghamslg.png" alt="Inghams" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/literalg.png" alt="Litera" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/minervalg.png" alt="Minerva" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/modellilg.png" alt="Modelli" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/montairelg.png" alt="Montaire" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/olymellg.png" alt="Olymel" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/pedrigaolg.png" alt="Pedrigao" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/pilgrimslg.png" alt="Pilgrims" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/sadialg.png" alt="Sadia" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/searalg.png" alt="Seara" className="max-w-full max-h-full object-contain" />
                </div>
                
                {/* Duplicate set for seamless loop */}
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/ajclg.png" alt="AJC" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/alliancelg.png" alt="Alliance" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/amecolg.png" alt="Ameco" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/auroralg.png" alt="Aurora" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/casinolg.png" alt="Casino" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/copacollg.png" alt="Copacol" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/excellg.png" alt="Excel" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/fieldalelg.png" alt="Fieldale" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/friboilg.png" alt="Friboi" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/hatfieldlg.png" alt="Hatfield" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/inghamslg.png" alt="Inghams" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/literalg.png" alt="Litera" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/minervalg.png" alt="Minerva" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/modellilg.png" alt="Modelli" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/montairelg.png" alt="Montaire" className="max-w-full max-h-full object-contain" />
              </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/olymellg.png" alt="Olymel" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/pedrigaolg.png" alt="Pedrigao" className="max-w-full max-h-full object-contain" />
              </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/pilgrimslg.png" alt="Pilgrims" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/sadialg.png" alt="Sadia" className="max-w-full max-h-full object-contain" />
              </div>
                <div className="flex-shrink-0 w-36 h-24 bg-[#fffefc] border-2 border-[#860809] rounded-lg flex items-center justify-center p-2">
                  <img src="/brandlogo/searalg.png" alt="Seara" className="max-w-full max-h-full object-contain" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Why Choose Us Section */}
      <motion.section 
        className="py-16 bg-[#fffefc]"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.h2 
              className="text-4xl font-bold text-[#860809] text-center mb-12 font-libre"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Why Choose Rosel Frozen Meat?
            </motion.h2>
            
            {/* Features Cards Row */}
            <div className="flex flex-col lg:flex-row justify-center items-center gap-8">
              {/* Card 1 - Good Pricing */}
              <motion.div 
                className="flex flex-col items-center p-6 rounded-lg w-72 sm:w-64 h-[28rem] sm:h-96 bg-[#f8f3ed] border-2 border-[#860809]"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="w-36 h-36 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-[#860809] rounded-lg mb-4 flex items-center justify-center">
                  <LucideTag className="w-16 h-16 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-white" />
                </div>
                <h3 className="text-3xl sm:text-xl lg:text-2xl font-bold text-[#a31f17] mb-3 text-center font-alice">Good Pricing</h3>
                <p className="text-xl sm:text-sm lg:text-base text-[#030105] text-center mb-4 font-libre">Rosel Frozen Meat offers competitive prices without compromising on quality.</p>
              </motion.div>

              {/* Card 2 - Online Deliver */}
              <motion.div 
                className="flex flex-col items-center p-6 rounded-lg w-72 sm:w-64 h-[28rem] sm:h-96 bg-[#f8f3ed] border-2 border-[#860809]"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="w-36 h-36 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-[#860809] rounded-lg mb-4 flex items-center justify-center">
                  <LucideTruck className="w-16 h-16 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-white" />
              </div>
                <h3 className="text-3xl sm:text-xl lg:text-2xl font-bold text-[#a31f17] mb-3 text-center font-alice">Online Deliver</h3>
                <p className="text-xl sm:text-sm lg:text-base text-[#030105] text-center mb-4 font-libre">Convenient online delivery service ensures customers get their orders fresh without waiting.</p>
              </motion.div>

              {/* Card 3 - Local Pick-Up */}
              <motion.div 
                className="flex flex-col items-center p-6 rounded-lg w-72 sm:w-64 h-[28rem] sm:h-96 bg-[#f8f3ed] border-2 border-[#860809]"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="w-36 h-36 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-[#860809] rounded-lg mb-4 flex items-center justify-center">
                  <LucideWarehouse className="w-16 h-16 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-white" />
                </div>
                <h3 className="text-3xl sm:text-xl lg:text-2xl font-bold text-[#a31f17] mb-3 text-center font-alice">Local Pick-Up</h3>
                <p className="text-xl sm:text-sm lg:text-base text-[#030105] text-center mb-4 font-libre">Convenient same-day local pick-up ensures customers get their orders fresh without waiting.</p>
              </motion.div>

              {/* Card 4 - Prestige */}
              <motion.div 
                className="flex flex-col items-center p-6 rounded-lg w-72 sm:w-64 h-[28rem] sm:h-96 bg-[#f8f3ed] border-2 border-[#860809]"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <div className="w-36 h-36 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-[#860809] rounded-lg mb-4 flex items-center justify-center">
                  <LucideCrown className="w-16 h-16 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-white" />
              </div>
                <h3 className="text-3xl sm:text-xl lg:text-2xl font-bold text-[#a31f17] mb-3 text-center font-alice">Prestige</h3>
                <p className="text-xl sm:text-sm lg:text-base text-[#030105] text-center font-libre">Trusted by loyal customers, Rosel upholds a reputation for quality and reliability in frozen goods.</p>
              </motion.div>
              </div>
            </div>
          </div>
      </motion.section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AboutPage;