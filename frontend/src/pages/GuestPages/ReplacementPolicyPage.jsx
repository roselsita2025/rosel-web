import Footer from "../../components/Footer.jsx";
import { motion } from "framer-motion";

const ReplacementPolicyPage = () => {
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
              Product Replacement Policy
            </motion.h1>
            <motion.p 
              className="text-xl text-white leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Comprehensive guidelines for requesting replacements with strict requirements for evidence, identity verification, and timeframe compliance in accordance with Philippine consumer protection laws.
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

      {/* Required Documentation */}
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
              Required Documentation
            </motion.h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div 
                className="bg-[#f8f3ed] p-8 rounded-xl shadow-lg border-2 border-[#860809]"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <h3 className="text-2xl font-bold text-[#860809] mb-6">1. Proof of Defect or Discrepancy</h3>
                <div className="space-y-4">
                  <div className="bg-[#fffefc] p-4 rounded-lg border border-[#a31f17]">
                    <h4 className="text-lg font-bold text-[#860809] mb-2">Photographic Evidence</h4>
                    <p className="text-[#030105] mb-2">Customers must provide clear photographic or video evidence of the issue immediately upon receipt of the product.</p>
                    <ul className="list-disc pl-5 space-y-1 text-[#030105]">
                      <li>Unaltered, time-stamped images or recordings</li>
                      <li>Capture the condition of the item as delivered</li>
                      <li>Include packaging and product labels</li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="bg-[#f8f3ed] p-8 rounded-xl shadow-lg border-2 border-[#860809]"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <h3 className="text-2xl font-bold text-[#860809] mb-6">2. Proof of Identity</h3>
                <div className="space-y-4">
                  <div className="bg-[#fffefc] p-4 rounded-lg border border-[#a31f17]">
                    <h4 className="text-lg font-bold text-[#860809] mb-2">Valid Government ID</h4>
                    <p className="text-[#030105] mb-2">A valid government-issued identification card must be presented:</p>
                    <ul className="list-disc pl-5 space-y-1 text-[#030105]">
                      <li>Passport</li>
                      <li>Driver's License</li>
                      <li>National ID</li>
                      <li>UMID</li>
                    </ul>
                    <p className="text-[#030105] mt-3 font-semibold">The name on the order and the presented ID must match to protect against fraudulent claims.</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Timeframe & Evaluation */}
      <motion.section 
        className="py-16 bg-[#f8f3ed]"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div 
                className="bg-[#fffefc] p-8 rounded-xl shadow-lg border-2 border-[#860809]"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <h3 className="text-2xl font-bold text-[#860809] mb-6">3. Timeframe of Reporting</h3>
                <div className="bg-[#f8f3ed] p-6 rounded-lg border border-[#a31f17]">
                  <p className="text-[#030105] leading-relaxed mb-4">
                    <strong>Replacement requests must be lodged within the same day of receipt.</strong>
                  </p>
                  <p className="text-[#030105] leading-relaxed">
                    Claims made after the allowable timeframe will not be entertained, except when explicitly provided for under Philippine consumer protection laws.
                  </p>
                </div>
              </motion.div>

              <motion.div 
                className="bg-[#fffefc] p-8 rounded-xl shadow-lg border-2 border-[#860809]"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <h3 className="text-2xl font-bold text-[#860809] mb-6">4. Evaluation and Approval</h3>
                <div className="bg-[#f8f3ed] p-6 rounded-lg border border-[#a31f17]">
                  <p className="text-[#030105] leading-relaxed mb-4">
                    <strong>The store reserves the right to inspect, verify, and evaluate the reported claim.</strong>
                  </p>
                  <p className="text-[#030105] leading-relaxed">
                    Replacements shall be granted only when the request passes inspection and is deemed valid and consistent with fair consumer protection principles.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Exclusions from Replacement */}
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
              Exclusions from Replacement
            </motion.h2>
            
            <motion.div 
              className="bg-[#f8f3ed] p-8 rounded-xl shadow-lg border-2 border-[#860809]"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="space-y-6">
                <div className="bg-[#fffefc] p-6 rounded-lg border border-[#a31f17]">
                  <h3 className="text-xl font-bold text-[#860809] mb-4">Items Not Eligible for Replacement</h3>
                  <ul className="list-disc pl-5 space-y-3 text-[#030105]">
                    <li><strong>Items mishandled, stored improperly, or tampered with after delivery</strong></li>
                    <li><strong>Claims without sufficient evidence or filed beyond the allowable period</strong></li>
                    <li><strong>Requests for replacement due to personal preference or change of mind</strong></li>
                  </ul>
                </div>
                
                <div className="bg-[#fffefc] p-6 rounded-lg border border-[#a31f17]">
                  <h3 className="text-xl font-bold text-[#860809] mb-4">Legal Reference</h3>
                  <p className="text-[#030105] leading-relaxed">
                    In line with <strong>Section 100 of RA 7394</strong>, which does not obligate sellers to accept returns for reasons not related to product defects or safety concerns.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Customer Agreement & Waiver */}
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
              Customer Agreement & Waiver
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
                  <h3 className="text-2xl font-bold text-[#860809] mb-4">Agreement to Policy Terms</h3>
                  <p className="text-[#030105] leading-relaxed text-lg">
                    <strong>By proceeding with a purchase, customers expressly waive any claim outside the above-stated provisions and agree to the conditions of this policy.</strong>
                  </p>
                </div>
                
                <div className="bg-[#f8f3ed] p-6 rounded-lg border border-[#a31f17]">
                  <h3 className="text-xl font-bold text-[#860809] mb-4">Legal Compliance</h3>
                  <p className="text-[#030105] leading-relaxed">
                    This policy is designed to comply with Philippine consumer protection laws while ensuring fair and transparent replacement procedures for legitimate product defects or discrepancies.
                  </p>
                </div>
                
                <div className="bg-[#f8f3ed] p-6 rounded-lg border border-[#a31f17]">
                  <h3 className="text-xl font-bold text-[#860809] mb-4">Policy Enforcement</h3>
                  <p className="text-[#030105] leading-relaxed">
                    All replacement requests will be evaluated strictly according to these guidelines. The store's decision on replacement eligibility is final and binding.
                  </p>
                </div>
              </div>
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
              <h2 className="text-3xl font-bold text-[#860809] mb-6">Need Assistance?</h2>
              <p className="text-[#030105] leading-relaxed mb-4">
                For questions about replacement requests or to submit a claim, please contact our customer service team.
              </p>
              <p className="text-[#030105] leading-relaxed">
                You can reach us through our Contact page or email our support team for assistance with replacement procedures.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
};

export default ReplacementPolicyPage;


