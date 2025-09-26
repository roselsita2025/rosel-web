import Footer from "../../components/Footer.jsx";
import { motion } from "framer-motion";

const PrivacyPolicyPage = () => {
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
              Privacy Policy
            </motion.h1>
            <motion.p 
              className="text-xl text-white leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              We recognize the importance of your trust and are fully committed to protecting your personal information in compliance with the Data Privacy Act of 2012 (RA 10173) and all applicable rules and regulations enforced by the National Privacy Commission (NPC).
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

      {/* Data Collection & Processing */}
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
              className="text-4xl font-bold text-[#860809] mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Information We Collect
            </motion.h2>
            
            <motion.div 
              className="bg-[#f8f3ed] p-8 rounded-xl shadow-lg border-2 border-[#860809] mb-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <p className="text-[#030105] leading-relaxed mb-6">
                When shopping with us, we may collect, process, and store personal information, including but not limited to:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-[#fffefc] p-6 rounded-lg border border-[#a31f17]">
                  <h3 className="text-xl font-bold text-[#860809] mb-4">Personal Details</h3>
                  <ul className="list-disc pl-5 space-y-2 text-[#030105]">
                    <li>Full name, billing and delivery address</li>
                    <li>Contact numbers and email address</li>
                    <li>Transaction history and order preferences</li>
                  </ul>
                </div>
                <div className="bg-[#fffefc] p-6 rounded-lg border border-[#a31f17]">
                  <h3 className="text-xl font-bold text-[#860809] mb-4">Verification Details</h3>
                  <ul className="list-disc pl-5 space-y-2 text-[#030105]">
                    <li>Identification details when required</li>
                    <li>Product replacement verification</li>
                    <li>Order verification purposes</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Purpose of Data Use */}
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
              className="text-4xl font-bold text-[#860809] mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              How We Use Your Information
            </motion.h2>
            
            <motion.div 
              className="bg-[#fffefc] p-8 rounded-xl shadow-lg border-2 border-[#860809]"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <p className="text-[#030105] leading-relaxed mb-6">
                We use this information solely for the following purposes:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-[#f8f3ed] p-4 rounded-lg border border-[#a31f17]">
                    <h3 className="text-lg font-bold text-[#860809] mb-2">Order Processing</h3>
                    <p className="text-[#030105]">To process and fulfill your orders efficiently</p>
                  </div>
                  <div className="bg-[#f8f3ed] p-4 rounded-lg border border-[#a31f17]">
                    <h3 className="text-lg font-bold text-[#860809] mb-2">Communication</h3>
                    <p className="text-[#030105]">To communicate updates, order confirmations, and delivery notifications</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-[#f8f3ed] p-4 rounded-lg border border-[#a31f17]">
                    <h3 className="text-lg font-bold text-[#860809] mb-2">Service Enhancement</h3>
                    <p className="text-[#030105]">To enhance our services and optimize your customer experience</p>
                  </div>
                  <div className="bg-[#f8f3ed] p-4 rounded-lg border border-[#a31f17]">
                    <h3 className="text-lg font-bold text-[#860809] mb-2">Legal Compliance</h3>
                    <p className="text-[#030105]">To comply with legal obligations, including fraud prevention, auditing, and compliance reporting</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Data Protection & Sharing */}
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
              className="text-4xl font-bold text-[#860809] mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Data Protection & Sharing
            </motion.h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div 
                className="bg-[#f8f3ed] p-8 rounded-xl shadow-lg border-2 border-[#860809]"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <h3 className="text-2xl font-bold text-[#860809] mb-6">Data Protection Guarantee</h3>
                <p className="text-[#030105] leading-relaxed mb-4">
                  We guarantee that we will not sell, rent, transfer, or disclose your personal data to unauthorized third parties.
                </p>
                <p className="text-[#030105] leading-relaxed">
                  Data may be shared exclusively with accredited partners such as delivery services strictly for the purpose of completing the transaction.
                </p>
              </motion.div>

              <motion.div 
                className="bg-[#f8f3ed] p-8 rounded-xl shadow-lg border-2 border-[#860809]"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <h3 className="text-2xl font-bold text-[#860809] mb-6">Data Retention & Security</h3>
                <p className="text-[#030105] leading-relaxed mb-4">
                  All data collected shall be retained only for as long as necessary to fulfill the purposes stated above, unless a longer retention period is required by law.
                </p>
                <p className="text-[#030105] leading-relaxed">
                  Industry-standard security measures are employed to prevent unauthorized access, alteration, or misuse of data.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Customer Rights & Consent */}
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
              className="text-4xl font-bold text-[#860809] mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Your Rights & Consent
            </motion.h2>
            
            <motion.div 
              className="bg-[#fffefc] p-8 rounded-xl shadow-lg border-2 border-[#860809] mb-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-[#860809] mb-6">Consent & Data Processing</h3>
              <p className="text-[#030105] leading-relaxed mb-4">
                By using our services, customers expressly consent to the collection, storage, and lawful processing of their data in accordance with this policy.
              </p>
              <p className="text-[#030105] leading-relaxed">
                Customers also reserve the right, under <strong>RA 10173</strong>, to access, correct, or request the deletion of their personal information by contacting our Data Protection Officer (DPO).
              </p>
            </motion.div>

            <motion.div 
              className="bg-[#fffefc] p-8 rounded-xl shadow-lg border-2 border-[#860809]"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-[#860809] mb-6">Product Quality & Replacement Policy</h3>
              <p className="text-[#030105] leading-relaxed mb-4">
                We take great pride in the premium quality of our meat products, which undergo strict quality control procedures to ensure that every item delivered meets sanitary, safety, and freshness standards as prescribed by the <strong>Food Safety Act of 2013 (RA 10611)</strong>.
              </p>
              <p className="text-[#030105] leading-relaxed">
                However, recognizing that isolated incidents of product defects may arise, we provide a clear and transparent product replacement policy aligned with both <strong>RA 7394 (Consumer Act of the Philippines)</strong> and <strong>RA 10611</strong>.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Contact Information */}
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
              <h2 className="text-3xl font-bold text-[#860809] mb-6">Contact Our Data Protection Officer</h2>
              <p className="text-[#030105] leading-relaxed mb-4">
                For privacy inquiries, data access requests, or any concerns regarding your personal information, please contact our Data Protection Officer (DPO).
              </p>
              <p className="text-[#030105] leading-relaxed">
                You can reach us through our Contact page or email our support team for assistance with your privacy rights under RA 10173.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;


