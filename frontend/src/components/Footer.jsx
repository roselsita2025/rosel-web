import { LucideFacebook, LucidePhone, LucideMail, LucideMapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <>
      {/* Footer Section */}
      <section className="py-6 sm:py-8 bg-[#f8f3ed] text-[#030105] shadow-lg border-t border-gray-300">
        <div className="container mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-12 lg:gap-16 max-w-7xl">
          <div className="space-y-3 sm:space-y-4 flex flex-col">
            <h3 className="text-xl sm:text-2xl font-bold">Rosel</h3>
            <p className="pr-0 md:pr-8 lg:pr-12 text-justify text-sm sm:text-base text-[#82695b]">Premium Quality Frozen Meat Delivered Fresh. Your trusted supplier of premium quality frozen meat.</p>
            <div className="flex space-x-4 pt-2 sm:pt-4">
              <a href={import.meta.env.VITE_FB_URL || "https://www.facebook.com/roselfrozenmeat"} className="hover:underline" target="_blank" rel="noopener noreferrer">
                <LucideFacebook className="w-7 h-7 sm:w-8 sm:h-8 text-[#82695b]" />
              </a>
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4 flex flex-col">
            <h3 className="text-xl sm:text-2xl font-bold">Support</h3>
            <Link to="/contactus" className="hover:underline text-sm sm:text-base text-[#82695b]">Contact Us</Link>
            <Link to="/order-guidelines" className="hover:underline text-sm sm:text-base text-[#82695b]">Order Guidelines</Link>
            <Link to="/privacy-policy" className="hover:underline text-sm sm:text-base text-[#82695b]">Privacy Policy</Link>
            <Link to="/product-replacement-policy" className="hover:underline text-sm sm:text-base text-[#82695b]">Product Replacement Policy</Link>
            <Link to="/terms-of-service" className="hover:underline text-sm sm:text-base text-[#82695b]">Terms of Service</Link>
          </div>
          <div className="space-y-3 sm:space-y-4 flex flex-col text-[#82695b] sm:col-span-2 lg:col-span-1">
            <h3 className="text-xl sm:text-2xl font-bold text-black">Contact Info</h3>
            <p className="flex items-start gap-2 text-sm sm:text-base">
              <LucidePhone className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#82695b]" /> 
              <span>{import.meta.env.VITE_LALAMOVE_PICK_PHONE || "+639263203832"}</span>
            </p>
            <p className="flex items-start gap-2 text-sm sm:text-base">
              <LucideMail className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#82695b]" /> 
              <span className="break-all">{import.meta.env.VITE_SENDGRID_SINGLE_SENDER || "roselsita.2025@gmail.com"}</span>
            </p>
            <p className="flex items-start gap-2 text-sm sm:text-base">
              <LucideMapPin className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#82695b]" /> 
              <span>{import.meta.env.VITE_LALAMOVE_PICKUP_ADDRESS || "Blk 8 Lot 4 Alagaw St., Greensite Homes Subd., Molino II, Bacoor City, Cavite, Philippines"}</span>
            </p>
          </div>
        </div>
      </section>
      <div className="border-t border-gray-300 shadow-md"></div>
      <footer className="bg-[#f8f3ed] text-[#030105] py-3">
        <div className="container mx-auto px-4 flex justify-center items-center">
          <p className="text-xs sm:text-sm text-center">© 2024 Rosel Frozen Meat Supplier. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
};

export default Footer;
