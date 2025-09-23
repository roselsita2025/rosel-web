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
              Clear guidelines for requesting replacements due to damage, incorrect items, or quality concerns.
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

      {/* Eligibility & Timeframe */}
      <motion.section 
        className="py-16 bg-[#fffefc]"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
            <motion.div 
              className="bg-[#f8f3ed] p-6 rounded-xl shadow border-2 border-[#860809]"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-[#860809] mb-4">Eligibility</h2>
              <ul className="list-disc pl-5 space-y-2 text-[#030105]">
                <li>Damaged or compromised packaging upon delivery or pickup</li>
                <li>Incorrect item received versus order confirmation</li>
                <li>Missing items from the order</li>
                <li>Quality concerns on first opening (off-odor, unusual color/texture)</li>
              </ul>
            </motion.div>
            <motion.div 
              className="bg-[#f8f3ed] p-6 rounded-xl shadow border-2 border-[#860809]"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-[#860809] mb-4">Timeframe</h2>
              <p className="text-[#030105]">
                Submit a replacement request within 24 hours of receiving your order. Requests beyond this
                window may not be eligible due to the perishable nature of frozen goods.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* What is not covered */}
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
              className="text-3xl font-bold text-[#860809] mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Not Covered
            </motion.h2>
            <motion.ul 
              className="list-disc pl-5 space-y-2 text-[#030105]"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <li>Improper handling or storage after delivery (e.g., not kept frozen)</li>
              <li>Normal variations in color, marbling, or size within product specifications</li>
              <li>Change of mind or preference after opening</li>
              <li>Products bought on clearance with disclosed imperfections</li>
            </motion.ul>
          </div>
        </div>
      </motion.section>

      {/* How to request a replacement */}
      <motion.section 
        className="py-16 bg-[#fffefc]"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
            <motion.div 
              className="bg-[#f8f3ed] p-6 rounded-xl shadow border-2 border-[#860809]"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-[#860809] mb-4">How to Request</h2>
              <ol className="list-decimal pl-5 space-y-2 text-[#030105]">
                <li>Log in to your account and open Track Orders.</li>
                <li>Select the affected order and choose "Replacement Request".</li>
                <li>Provide details and upload clear photos/videos (packaging, labels, product).</li>
                <li>Submit within 24 hours of receipt for review.</li>
              </ol>
            </motion.div>
            <motion.div 
              className="bg-[#f8f3ed] p-6 rounded-xl shadow border-2 border-[#860809]"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-[#860809] mb-4">Required Proof</h2>
              <ul className="list-disc pl-5 space-y-2 text-[#030105]">
                <li>Order number and delivery/pickup date</li>
                <li>Photos of outer packaging and product condition</li>
                <li>Short description of the issue (e.g., wrong item, damaged, missing)</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Review & Outcomes */}
      <motion.section 
        className="py-16 bg-[#f8f3ed]"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
            <motion.div 
              className="bg-[#fffefc] p-6 rounded-xl shadow border-2 border-[#860809]"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="text-xl font-bold text-[#860809] mb-2">Review Timeline</h3>
              <p className="text-[#030105]">Most requests are reviewed within 1–2 business days.</p>
            </motion.div>
            <motion.div 
              className="bg-[#fffefc] p-6 rounded-xl shadow border-2 border-[#860809]"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <h3 className="text-xl font-bold text-[#860809] mb-2">Possible Outcomes</h3>
              <ul className="list-disc pl-5 space-y-2 text-[#030105]">
                <li>Replacement of the affected item(s)</li>
                <li>Partial replacement or store credit when appropriate</li>
                <li>Request for additional information if evidence is unclear</li>
              </ul>
            </motion.div>
            <motion.div 
              className="bg-[#fffefc] p-6 rounded-xl shadow border-2 border-[#860809]"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <h3 className="text-xl font-bold text-[#860809] mb-2">Final Decisions</h3>
              <p className="text-[#030105]">Quality assessments and eligibility determinations are final once completed.</p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Logistics & Fees */}
      <motion.section 
        className="py-16 bg-[#fffefc]"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
            <motion.div 
              className="bg-[#f8f3ed] p-6 rounded-xl shadow border-2 border-[#860809]"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-[#860809] mb-4">Logistics</h2>
              <ul className="list-disc pl-5 space-y-2 text-[#030105]">
                <li>For delivery issues, we may arrange courier pickup or a re-delivery.</li>
                <li>For pickup orders, replacements are usually claimed at the store.</li>
              </ul>
            </motion.div>
            <motion.div 
              className="bg-[#f8f3ed] p-6 rounded-xl shadow border-2 border-[#860809]"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-[#860809] mb-4">Fees</h2>
              <p className="text-[#030105]">
                Eligible replacements are provided at no additional cost. If the request is not eligible, delivery or
                handling fees may apply for return/re-delivery options.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Important Notes */}
      <motion.section 
        className="py-16 bg-[#f8f3ed]"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Frozen Goods",
                text: "Keep products frozen until use. Do not refreeze thawed items.",
              },
              {
                title: "Inspection on Receipt",
                text: "Please inspect items upon receipt and report issues immediately.",
              },
              {
                title: "Contact Support",
                text: "If you cannot submit online, contact us via the Contact page for assistance.",
              },
            ].map((note, index) => (
              <motion.div 
                key={note.title} 
                className="bg-[#fffefc] p-6 rounded-xl shadow border-2 border-[#860809]"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + (index * 0.1) }}
                viewport={{ once: true }}
              >
                <h3 className="text-xl font-bold text-[#860809] mb-2">{note.title}</h3>
                <p className="text-[#030105]">{note.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
};

export default ReplacementPolicyPage;


