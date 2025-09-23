import { FAQ } from '../models/faq.model.js';

export const seedFAQs = async () => {
    try {
        // Check if FAQs already exist
        const existingFAQs = await FAQ.countDocuments();
        if (existingFAQs > 0) {
            console.log('FAQs already exist, skipping seed');
            return;
        }

        const faqs = [
            {
                question: "What are your delivery areas?",
                answer: "We deliver to all areas within Metro Manila and selected provinces. Please contact us to confirm delivery availability in your area.",
                category: "delivery",
                keywords: ["delivery", "areas", "metro manila", "provinces", "location"],
                priority: 10
            },
            {
                question: "How long does delivery take?",
                answer: "Standard delivery takes 1-2 business days for Metro Manila and 2-3 business days for provincial areas. Express delivery options are available.",
                category: "delivery",
                keywords: ["delivery", "time", "days", "metro manila", "provincial", "express"],
                priority: 9
            },
            {
                question: "What payment methods do you accept?",
                answer: "We accept cash on delivery, bank transfers, credit/debit cards, and digital wallets for your convenience.",
                category: "payment",
                keywords: ["payment", "methods", "cash", "delivery", "bank", "transfer", "card", "digital", "wallet"],
                priority: 8
            },
            {
                question: "How can I track my order?",
                answer: "You can track your order by logging into your account and going to the 'Track Orders' section. You'll receive updates via email and SMS.",
                category: "orders",
                keywords: ["track", "order", "account", "email", "sms", "updates"],
                priority: 7
            },
            {
                question: "What if I'm not satisfied with my order?",
                answer: "We offer a replacement request system. You can submit a replacement request within 24 hours of delivery if you're not satisfied with the quality of your order.",
                category: "returns",
                keywords: ["satisfied", "order", "replacement", "request", "quality", "24 hours"],
                priority: 6
            },
            {
                question: "How do I place an order?",
                answer: "Simply browse our products, add items to your cart, proceed to checkout, provide your delivery information, and complete payment. It's that easy!",
                category: "orders",
                keywords: ["place", "order", "browse", "products", "cart", "checkout", "payment"],
                priority: 5
            },
            {
                question: "Are your products fresh?",
                answer: "Yes, we guarantee fresh, high-quality meat products. All our products are sourced from trusted suppliers and delivered fresh to your doorstep.",
                category: "products",
                keywords: ["fresh", "quality", "meat", "products", "suppliers", "guarantee"],
                priority: 4
            },
            {
                question: "What are your business hours?",
                answer: "We operate Monday to Friday from 8:00 AM to 6:00 PM, and Saturday from 9:00 AM to 4:00 PM. We're closed on Sundays.",
                category: "general",
                keywords: ["business", "hours", "monday", "friday", "saturday", "sunday", "closed"],
                priority: 3
            },
            {
                question: "How can I contact customer support?",
                answer: "You can contact us through our live chat feature, email at info@roselmeat.com, or call us at +63 926 320 3832.",
                category: "general",
                keywords: ["contact", "support", "chat", "email", "phone", "help"],
                priority: 2
            },
            {
                question: "Do you offer bulk orders?",
                answer: "Yes, we offer special pricing for bulk orders. Please contact us directly to discuss your requirements and get a custom quote.",
                category: "orders",
                keywords: ["bulk", "orders", "special", "pricing", "custom", "quote", "requirements"],
                priority: 1
            }
        ];

        await FAQ.insertMany(faqs);
        console.log('FAQs seeded successfully');
    } catch (error) {
        console.error('Error seeding FAQs:', error);
    }
};
