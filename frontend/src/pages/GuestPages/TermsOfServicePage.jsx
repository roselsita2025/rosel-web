import Footer from "../../components/Footer.jsx";
import { motion } from "framer-motion";

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-[#f8f3ed]">
      {/* Hero */}
      <motion.section 
        className="pt-32 pb-20 bg-[#901414]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1 
              className="text-5xl md:text-6xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Terms of Service
            </motion.h1>
            <motion.p 
              className="text-xl text-white leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              By accessing, browsing, and transacting through our ecommerce platform, you signify your full and unconditional acceptance of these Terms of Service.
            </motion.p>
            <motion.p 
              className="text-sm text-white mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Effective Date: September 20, 2025
            </motion.p>
          </div>
        </div>
      </motion.section>

      {/* Agreement Overview */}
      <motion.section 
        className="py-16 bg-[#fffefc]"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              className="bg-[#f8f3ed] p-8 rounded-xl shadow-lg border-2 border-[#860809]"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-[#860809] mb-6 text-center">Complete Agreement</h2>
              <p className="text-[#030105] leading-relaxed text-lg text-center">
                These terms, together with our <strong>Order Guidelines</strong>, <strong>Product Replacement Policy</strong>, and <strong>Privacy Policy</strong>, form the entire agreement between the customer and the store.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Customer Responsibilities */}
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
              className="text-4xl font-bold text-[#860809] mb-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Customer Responsibilities
            </motion.h2>
            
            <motion.div 
              className="bg-[#fffefc] p-8 rounded-xl shadow-lg border-2 border-[#860809]"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="space-y-6">
                <div className="bg-[#f8f3ed] p-6 rounded-lg border border-[#a31f17]">
                  <h3 className="text-xl font-bold text-[#860809] mb-4">Information Accuracy</h3>
                  <p className="text-[#030105] leading-relaxed">
                    To provide accurate, complete, and truthful information when placing orders.
                  </p>
                </div>
                
                <div className="bg-[#f8f3ed] p-6 rounded-lg border border-[#a31f17]">
                  <h3 className="text-xl font-bold text-[#860809] mb-4">Legal Compliance</h3>
                  <p className="text-[#030105] leading-relaxed">
                    To comply with all applicable Philippine laws, rules, and regulations when using the service.
                  </p>
                </div>
                
                <div className="bg-[#f8f3ed] p-6 rounded-lg border border-[#a31f17]">
                  <h3 className="text-xl font-bold text-[#860809] mb-4">Conduct Standards</h3>
                  <p className="text-[#030105] leading-relaxed">
                    To refrain from fraudulent activity, abuse of the platform, or disrespectful conduct toward store personnel.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Store Rights and Discretion */}
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
              className="text-4xl font-bold text-[#860809] mb-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Store Rights and Discretion
            </motion.h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div 
                className="bg-[#f8f3ed] p-6 rounded-xl shadow-lg border-2 border-[#860809]"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <h3 className="text-xl font-bold text-[#860809] mb-4">Terms Modification</h3>
                <p className="text-[#030105] leading-relaxed">
                  We reserve the right to modify, amend, or update these terms at any time without prior notice. Continued use of the service constitutes agreement to the most recent version.
                </p>
              </motion.div>

              <motion.div 
                className="bg-[#f8f3ed] p-6 rounded-xl shadow-lg border-2 border-[#860809]"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <h3 className="text-xl font-bold text-[#860809] mb-4">Service Refusal</h3>
                <p className="text-[#030105] leading-relaxed">
                  We reserve the right to refuse service in cases involving fraud, policy violations, abusive language or behavior toward staff, or any activity inconsistent with fair and lawful business practices.
                </p>
              </motion.div>

              <motion.div 
                className="bg-[#f8f3ed] p-6 rounded-xl shadow-lg border-2 border-[#860809]"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <h3 className="text-xl font-bold text-[#860809] mb-4">Account Actions</h3>
                <p className="text-[#030105] leading-relaxed">
                  We reserve the right to suspend or terminate accounts involved in repeated violations.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Legal Compliance */}
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
              className="text-4xl font-bold text-[#860809] mb-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Legal Compliance
            </motion.h2>
            
            <motion.div 
              className="bg-[#fffefc] p-8 rounded-xl shadow-lg border-2 border-[#860809] mb-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-[#860809] mb-6">Governing Law</h3>
              <p className="text-[#030105] leading-relaxed mb-6">
                These terms shall be governed by and construed in accordance with the laws of the Republic of the Philippines, including but not limited to:
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-[#f8f3ed] p-4 rounded-lg border border-[#a31f17]">
                  <h4 className="text-lg font-bold text-[#860809] mb-2">RA 7394</h4>
                  <p className="text-[#030105]">Consumer Act of the Philippines</p>
                </div>
                <div className="bg-[#f8f3ed] p-4 rounded-lg border border-[#a31f17]">
                  <h4 className="text-lg font-bold text-[#860809] mb-2">RA 10173</h4>
                  <p className="text-[#030105]">Data Privacy Act of 2012</p>
                </div>
                <div className="bg-[#f8f3ed] p-4 rounded-lg border border-[#a31f17]">
                  <h4 className="text-lg font-bold text-[#860809] mb-2">RA 10611</h4>
                  <p className="text-[#030105]">Food Safety Act of 2013</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="bg-[#fffefc] p-8 rounded-xl shadow-lg border-2 border-[#860809]"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-[#860809] mb-6">Dispute Resolution</h3>
              <p className="text-[#030105] leading-relaxed">
                Any dispute arising out of or relating to these terms shall be resolved exclusively within the proper courts of law in the Philippines, without prejudice to the rights of consumers as provided by law.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Binding Agreement */}
      <motion.section 
        className="py-16 bg-[#fffefc]"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              className="bg-[#f8f3ed] p-8 rounded-xl shadow-lg border-2 border-[#860809] text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-[#860809] mb-6">Binding Contractual Agreement</h2>
              <p className="text-[#030105] leading-relaxed text-lg">
                <strong>By proceeding to place an order, you enter into a binding contractual agreement built upon principles of trust, transparency, fairness, and lawful compliance.</strong>
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
};

export default TermsOfServicePage;


