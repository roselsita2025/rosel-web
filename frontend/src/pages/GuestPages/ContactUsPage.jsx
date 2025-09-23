
import { useState, useEffect } from "react";
import { MapPin, Phone, Mail, Clock, Send, User, MessageSquare, Loader2 } from "lucide-react";
import Footer from "../../components/Footer.jsx";
import SimpleMap from "../../components/SimpleMap.jsx";
import toast from "react-hot-toast";
import axios from "axios";
import { motion } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ContactUsPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendState, setSendState] = useState('idle'); // idle | success | error
  const [contactInfo, setContactInfo] = useState({
    address: "Loading...",
    phone: "Loading...",
    email: "Loading..."
  });


  // Load contact information on component mount
  useEffect(() => {
    const loadContactInfo = async () => {
      try {
        const response = await axios.get(`${API_URL}/contact/info`);
        if (response.data.success) {
          setContactInfo(response.data.data);
          
          // Console log the lat/lng values from the API
          console.log('LALAMOVE_PICKUP_LAT from API:', response.data.data.lat);
          console.log('LALAMOVE_PICKUP_LNG from API:', response.data.data.lng);
        }
      } catch (error) {
        console.error('Failed to load contact info:', error);
        // Keep default loading text if API fails
      }
    };

    loadContactInfo();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post(`${API_URL}/contact/send-message`, formData);
      
      if (response.data.success) {
        setSendState('success');
        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          message: ""
        });
      } else {
        setSendState('error');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      setSendState('error');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSendState('idle'), 1500);
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-[#fffefc]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Hero Section */}
      <motion.section 
        className="pt-32 pb-8 bg-[#901414]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <motion.h1 
              className="text-5xl md:text-6xl font-bold text-white mb-6 font-libre"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Contact Us
            </motion.h1>
            <motion.p 
              className="text-xl text-white leading-relaxed font-alice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              Get in touch with us for any inquiries or support
            </motion.p>
          </motion.div>
          </div>
      </motion.section>

      {/* Contact Information & Map Section */}
      <motion.section 
        className="py-16 bg-[#f8f3ed]"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Information */}
              <motion.div 
                className="space-y-8"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-4xl font-bold text-[#a31f17] mb-6 font-libre">
                    Get In Touch
                  </h2>
                  <p className="text-[#030105] text-lg leading-relaxed mb-8 max-w-lg font-alice">
                    We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                  </p>
                </motion.div>

                {/* Contact Details */}
                <motion.div 
                  className="space-y-6"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  viewport={{ once: true }}
                >
                  {[
                    { icon: MapPin, title: "Address", content: contactInfo.address, isPreLine: true },
                    { icon: Phone, title: "Phone", content: contactInfo.phone, isPreLine: false },
                    { icon: Mail, title: "Email", content: contactInfo.email, isPreLine: false },
                    { 
                      icon: Clock, 
                      title: "Business Hours", 
                      content: "Monday - Friday: 8:00 AM - 6:00 PM\nSaturday: 9:00 AM - 4:00 PM\nSunday: Closed",
                      isPreLine: true 
                    }
                  ].map((item, index) => (
                    <motion.div 
                      key={item.title}
                      className="flex items-start space-x-4"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 + (index * 0.1) }}
                      viewport={{ once: true }}
                    >
                    <div className="w-12 h-12 bg-[#860809] rounded-full flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-6 h-6 text-[#fffefc]" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#a31f17] mb-2 font-alice">{item.title}</h3>
                        <p className={`text-[#030105] ${item.isPreLine ? 'whitespace-pre-line' : ''} font-libre`}>
                          {item.content}
                      </p>
                    </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Map */}
              <motion.div 
                className="bg-transparent rounded-2xl p-8"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <motion.h3 
                  className="text-3xl font-bold text-[#860809] mb-6 text-center font-libre"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  Find Us
                </motion.h3>
                <motion.div 
                  className="border-2 border-[#901414] rounded-lg overflow-hidden h-96"
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  viewport={{ once: true }}
                >
                  <SimpleMap className="h-full" />
                </motion.div>
              </motion.div>
                    </div>
                    </div>
                  </div>
      </motion.section>


      {/* FAQ & Contact Form Section */}
      <motion.section 
        className="py-16 bg-[#fffefc]"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* FAQ Section */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <motion.h2 
                  className="text-4xl font-bold text-[#860809] mb-8 font-libre"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  Frequently Asked Questions
                </motion.h2>
                <motion.div 
                  className="space-y-6"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  viewport={{ once: true }}
                >
                  {[
                    {
                      question: "What are your delivery areas?",
                      answer: "We deliver to all areas within Metro Manila and selected provinces. Please contact us to confirm delivery availability in your area."
                    },
                    {
                      question: "How long does delivery take?",
                      answer: "Standard delivery takes 1-2 business days for Metro Manila and 2-3 business days for provincial areas. Express delivery options are available."
                    },
                    {
                      question: "What payment methods do you accept?",
                      answer: "We accept cash on delivery, bank transfers, credit/debit cards, and digital wallets for your convenience."
                    }
                  ].map((faq, index) => (
                    <motion.div 
                      key={faq.question}
                      className="bg-[#f8f3ed] p-6 rounded-xl"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 + (index * 0.1) }}
                      viewport={{ once: true }}
                    >
                      <h3 className="text-xl font-bold text-[#a31f17] mb-3 font-alice">
                        {faq.question}
                      </h3>
                      <p className="text-[#030105] font-libre">
                        {faq.answer}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Contact Form */}
              <motion.div 
                className="bg-[#f8f3ed] p-8 rounded-2xl shadow-lg"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <motion.h3 
                  className="text-2xl font-bold text-[#860809] mb-6 flex items-center font-libre"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <MessageSquare className="w-6 h-6 mr-2" />
                  Send us a Message
                </motion.h3>
                
                <motion.form 
                  onSubmit={handleSubmit} 
                  className="space-y-6"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  viewport={{ once: true }}
                >
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-[#030105] mb-2 font-alice">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#860809]" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-[#860809] rounded-lg focus:ring-2 focus:ring-[#a31f17] focus:border-transparent bg-[#fffefc] text-[#030105] placeholder-[#82695b]"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-[#030105] mb-2 font-alice">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#860809]" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-[#860809] rounded-lg focus:ring-2 focus:ring-[#a31f17] focus:border-transparent bg-[#fffefc] text-[#030105] placeholder-[#82695b]"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-[#030105] mb-2 font-alice">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#860809]" />
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-[#860809] rounded-lg focus:ring-2 focus:ring-[#a31f17] focus:border-transparent bg-[#fffefc] text-[#030105] placeholder-[#82695b]"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-[#030105] mb-2 font-alice">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={5}
                      className="w-full px-4 py-3 border border-[#860809] rounded-lg focus:ring-2 focus:ring-[#a31f17] focus:border-transparent bg-[#fffefc] text-[#030105] placeholder-[#82695b] resize-none"
                      placeholder="Tell us how we can help you..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full text-[#fffefc] font-bold py-3 px-6 rounded-lg transition duration-300 flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed ${
                      sendState === 'success' ? 'bg-emerald-600' : sendState === 'error' ? 'bg-red-600' : 'bg-[#860809] hover:bg-[#a31f17]'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>{sendState === 'success' ? 'Message Sent' : sendState === 'error' ? 'Failed to Send' : 'Send Message'}</span>
                      </>
                    )}
                  </button>
                </motion.form>
              </motion.div>
              </div>
            </div>
          </div>
      </motion.section>

      {/* Footer */}
      <Footer />
    </motion.div>
  );
};

export default ContactUsPage;