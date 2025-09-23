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
              Please read these terms carefully before using our services.
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

      {/* Content */}
      <motion.section 
        className="py-16 bg-[#fffefc]"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-[#860809] mb-4">1. Agreement to Terms</h2>
              <p className="text-[#030105]">
                By accessing or using our website and services, you agree to be bound by these Terms of Service and our
                Privacy Policy. If you do not agree, please discontinue use of our services.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-[#860809] mb-4">2. Accounts & Security</h2>
              <ul className="list-disc pl-5 space-y-2 text-[#030105]">
                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                <li>You must notify us immediately of any unauthorized use or breach.</li>
                <li>We may suspend or terminate accounts for violations of these terms.</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-[#860809] mb-4">3. Orders & Availability</h2>
              <ul className="list-disc pl-5 space-y-2 text-[#030105]">
                <li>All orders are subject to acceptance and availability.</li>
                <li>Prices, promotions, and product information may change without prior notice.</li>
                <li>We reserve the right to limit or cancel quantities at our discretion.</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-[#860809] mb-4">4. Payments</h2>
              <p className="text-[#030105]">
                You agree to provide accurate billing information. Payments are processed by our third-party provider.
                If a transaction is declined or reversed, we may suspend fulfillment until resolved.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-[#860809] mb-4">5. Delivery & Risk of Loss</h2>
              <p className="text-[#030105]">
                Risk of loss transfers upon delivery to the address provided or upon pickup. Please inspect items upon
                receipt and report issues promptly in accordance with our Replacement Policy.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-[#860809] mb-4">6. Acceptable Use</h2>
              <ul className="list-disc pl-5 space-y-2 text-[#030105]">
                <li>Do not misuse the site or attempt unauthorized access.</li>
                <li>Do not engage in fraud, abusive behavior, or activities that harm others.</li>
                <li>Respect applicable laws and third-party rights at all times.</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-[#860809] mb-4">7. Intellectual Property</h2>
              <p className="text-[#030105]">
                All content, trademarks, and logos are owned by us or our licensors and are protected by law. You may not
                use these without prior written permission.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-[#860809] mb-4">8. Disclaimers & Limitation of Liability</h2>
              <p className="text-[#030105]">
                Services are provided "as is" without warranties of any kind. To the maximum extent permitted by law, we
                are not liable for indirect, incidental, or consequential damages.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-[#860809] mb-4">9. Termination</h2>
              <p className="text-[#030105]">
                We may suspend or terminate access to services at any time for any reason, including violations of these
                terms.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-[#860809] mb-4">10. Changes to Terms</h2>
              <p className="text-[#030105]">
                We may update these terms from time to time. Continued use after changes constitutes acceptance of the
                updated terms.
              </p>
            </motion.div>

            <motion.div 
              className="bg-[#f8f3ed] p-6 rounded-xl border-2 border-[#860809]"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-[#860809] mb-4">11. Contact</h2>
              <p className="text-[#030105]">
                For questions about these Terms, please contact us via the Contact page.
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


