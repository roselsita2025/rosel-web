import Footer from "../../components/Footer.jsx";
import { motion } from "framer-motion";

const OrderGuidelinesPage = () => {
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
              Order Guidelines
            </motion.h1>
            <motion.p 
              className="text-xl text-white leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Everything you need to know to place, track, and receive your orders smoothly.
            </motion.p>
          </div>
        </div>
      </motion.section>

      {/* Operating Hours & Business Policies */}
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
              Operating Hours & Business Policies
            </motion.h2>
            
            <motion.div 
              className="bg-[#f8f3ed] p-8 rounded-xl shadow-lg border-2 border-[#860809] mb-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-[#860809] mb-6">Store Operating Hours</h3>
              <div className="bg-[#fffefc] p-6 rounded-lg border border-[#a31f17] mb-6">
                <p className="text-lg font-semibold text-[#860809] mb-4">
                  Daily: 9:00 AM to 10:00 PM
                </p>
                <p className="text-[#030105] leading-relaxed">
                  Our store operates daily from 9:00 AM to 10:00 PM, strictly adhering to internal business protocols and external regulations governing the safe and proper handling of perishable food products. Orders submitted beyond operational hours shall be automatically queued and processed on the next business day.
                </p>
              </div>
              <p className="text-[#030105] leading-relaxed">
                This policy is in place not merely for logistical efficiency but also for the preservation of quality, in accordance with the principles of <strong>Republic Act (RA) 7394, the Consumer Act of the Philippines</strong>, which ensures that all consumers receive goods that meet the highest safety and quality standards.
              </p>
            </motion.div>

            <motion.div 
              className="bg-[#f8f3ed] p-8 rounded-xl shadow-lg border-2 border-[#860809]"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-[#860809] mb-6">Order Review & Verification</h3>
              <p className="text-[#030105] leading-relaxed mb-4">
                Customers are strongly encouraged to review their orders thoroughly before finalizing checkout. This includes verifying:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#030105] mb-4">
                <li>Product type and specific cuts</li>
                <li>Quantity and pricing</li>
                <li>Delivery address and contact details</li>
              </ul>
              <p className="text-[#030105] leading-relaxed">
                Any errors or omissions provided during checkout may result in processing delays, which the company shall not be held liable for. To ensure fairness, same-day delivery requests must be confirmed and paid before the designated cut-off time.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Payment & Receipts */}
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
              Payment & Receipts
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Accepted Methods",
                  items: [
                    "Credit/Debit Cards",
                    "Digital Wallets",
                    "Bank Transfer (where available)",
                  ],
                },
                {
                  title: "Security",
                  items: [
                    "Payments are processed securely via Stripe.",
                    "We do not store your card details.",
                  ],
                },
                {
                  title: "Receipts",
                  items: [
                    "An email confirmation is sent after checkout.",
                    "Download receipts from your account's order details.",
                  ],
                },
              ].map((card) => (
                <motion.div 
                  key={card.title} 
                  className="bg-[#fffefc] p-6 rounded-xl shadow border-2 border-[#860809]"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-xl font-bold text-[#a31f17] mb-3">{card.title}</h3>
                  <ul className="list-disc pl-5 space-y-2 text-[#030105]">
                    {card.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Delivery Options */}
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
              className="text-3xl font-bold text-[#860809] mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Delivery Options
            </motion.h2>
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div 
                className="bg-[#f8f3ed] p-6 rounded-xl shadow border-2 border-[#860809]"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <h3 className="text-xl font-bold text-[#a31f17] mb-3">Pickup</h3>
                <p className="text-[#030105] mb-4">
                  Pick up your order at our store. You will receive a notification when your order is ready.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-[#030105]">
                  <li>Bring your order number and a valid ID.</li>
                  <li>Orders are held for 2 days after ready-for-pickup notice.</li>
                </ul>
              </motion.div>
              <motion.div 
                className="bg-[#f8f3ed] p-6 rounded-xl shadow border-2 border-[#860809]"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <h3 className="text-xl font-bold text-[#a31f17] mb-3">Lalamove Delivery</h3>
                <p className="text-[#030105] mb-4">
                  For eligible areas, we arrange delivery via Lalamove. Delivery fees and ETAs are shown at checkout.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-[#030105]">
                  <li>Ensure someone is available to receive the package.</li>
                  <li>Track updates are available in your order details page.</li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Customer Agreement & Terms */}
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
              Customer Agreement & Terms
            </motion.h2>
            
            <motion.div 
              className="bg-[#fffefc] p-8 rounded-xl shadow-lg border-2 border-[#860809] mb-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-[#860809] mb-6">By placing an order with our store, the customer voluntarily acknowledges and agrees that:</h3>
              <div className="space-y-6">
                <div className="bg-[#f8f3ed] p-6 rounded-lg border border-[#a31f17]">
                  <div className="flex items-start">
                    <span className="mr-4 mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#860809] text-white text-lg font-bold flex-shrink-0">
                      1
                    </span>
                    <p className="text-[#030105] leading-relaxed">
                      <strong>Orders placed after 10:00 PM will be automatically processed the following day.</strong>
                    </p>
                  </div>
                </div>
                
                <div className="bg-[#f8f3ed] p-6 rounded-lg border border-[#a31f17]">
                  <div className="flex items-start">
                    <span className="mr-4 mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#860809] text-white text-lg font-bold flex-shrink-0">
                      2
                    </span>
                    <p className="text-[#030105] leading-relaxed">
                      <strong>Deliveries and pickups will only be honored within business hours to comply with operational safety standards.</strong>
                    </p>
                  </div>
                </div>
                
                <div className="bg-[#f8f3ed] p-6 rounded-lg border border-[#a31f17]">
                  <div className="flex items-start">
                    <span className="mr-4 mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#860809] text-white text-lg font-bold flex-shrink-0">
                      3
                    </span>
                    <p className="text-[#030105] leading-relaxed">
                      <strong>Cancellations made after orders have been dispatched will not be honored, except in cases permitted under the Consumer Act of the Philippines, specifically relating to defective or unsafe products.</strong>
                    </p>
                  </div>
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
              <h3 className="text-2xl font-bold text-[#860809] mb-6">Company Rights & Fraud Protection</h3>
              <div className="bg-[#f8f3ed] p-6 rounded-lg border border-[#a31f17]">
                <p className="text-[#030105] leading-relaxed">
                  The company reserves the absolute right to cancel or reject transactions suspected to involve fraudulent activity, misrepresentation, or abuse of the ordering system. These policies are designed not only to protect the integrity of our services but also to uphold fair trade practices as mandated by Philippine law.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Handling & Storage */}
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
              className="text-3xl font-bold text-[#860809] mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Product Handling & Storage
            </motion.h2>
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div 
                className="bg-[#f8f3ed] p-6 rounded-xl shadow border-2 border-[#860809]"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <h3 className="text-xl font-bold text-[#a31f17] mb-3">Do's</h3>
                <ul className="list-disc pl-5 space-y-2 text-[#030105]">
                  <li>Store products in the freezer upon receipt.</li>
                  <li>Thaw under refrigeration for best quality.</li>
                  <li>Cook thoroughly following safe temperature guidelines.</li>
                </ul>
              </motion.div>
              <motion.div 
                className="bg-[#f8f3ed] p-6 rounded-xl shadow border-2 border-[#860809]"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <h3 className="text-xl font-bold text-[#a31f17] mb-3">Don'ts</h3>
                <ul className="list-disc pl-5 space-y-2 text-[#030105]">
                  <li>Do not refreeze thawed products.</li>
                  <li>Do not leave frozen items at room temperature.</li>
                  <li>Avoid exposing products to direct sunlight.</li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* FAQ Snippets */}
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
              className="text-3xl font-bold text-[#860809] text-center mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Frequently Asked
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  q: "Where can I track my order?",
                  a: "Go to Track Orders in your profile menu to view real-time updates.",
                },
                {
                  q: "What if I'm not available during delivery?",
                  a: "Please ensure someone is authorized to receive the package at your address.",
                },
                {
                  q: "Can I use multiple coupons?",
                  a: "Only one coupon can be applied per order unless otherwise stated.",
                },
              ].map((faq, index) => (
                <motion.div 
                  key={faq.q} 
                  className="bg-[#fffefc] p-6 rounded-xl shadow border-2 border-[#860809]"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + (index * 0.1) }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-lg font-bold text-[#a31f17] mb-2">{faq.q}</h3>
                  <p className="text-[#030105]">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default OrderGuidelinesPage;


