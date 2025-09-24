import { LucideFacebook, LucidePhone, LucideMail, LucideMapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <>
      {/* Footer Section */}
      <section className="py-8 bg-[#f8f3ed] text-[#030105] shadow-lg border-t border-gray-300">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-24 max-w-7xl">
          <div className="space-y-4 flex flex-col">
            <h3 className="text-2xl font-bold">Rosel</h3>
            <p className="pr-20 text-justify text-[#82695b]">Premium Quality Frozen Meat Delivered Fresh. Your trusted supplier of premium quality frozen meat.</p>
            <div className="flex space-x-4 pt-4">
              <a href={import.meta.env.VITE_FB_URL || "https://www.facebook.com/roselfrozenmeat"} className="hover:underline" target="_blank" rel="noopener noreferrer">
                <LucideFacebook className="w-8 h-8 text-[#82695b]" />
              </a>
            </div>
          </div>
          <div className="space-y-4 flex flex-col">
            <h3 className="text-2xl font-bold">Support</h3>
            <Link to="/contactus" className="hover:underline text-[#82695b]">Contact Us</Link>
            <Link to="/order-guidelines" className="hover:underline text-[#82695b]">Order Guidelines</Link>
            <Link to="/privacy-policy" className="hover:underline text-[#82695b]">Privacy Policy</Link>
            <Link to="/product-replacement-policy" className="hover:underline text-[#82695b]">Product Replacement Policy</Link>
            <Link to="/terms-of-service" className="hover:underline text-[#82695b]">Terms of Service</Link>
          </div>
          <div className="space-y-4 flex flex-col text-[#82695b]">
            <h3 className="text-2xl font-bold text-black">Contact Info</h3>
            <p><LucidePhone className="inline w-4 h-4 text-[#82695b]" /> {import.meta.env.VITE_LALAMOVE_PICK_PHONE || "+639263203832"}</p>
            <p><LucideMail className="inline w-4 h-4 text-[#82695b]" /> {import.meta.env.VITE_SENDGRID_SINGLE_SENDER || "roselsita.2025@gmail.com"}</p>
            <p><LucideMapPin className="inline w-4 h-4 text-[#82695b]" /> {import.meta.env.VITE_LALAMOVE_PICKUP_ADDRESS || "Blk 8 Lot 4 Alagaw St., Greensite Homes Subd., Molino II, Bacoor City, Cavite, Philippines"}</p>
          </div>
        </div>
      </section>
      <div className="border-t border-gray-300 shadow-md"></div>
      <footer className="bg-[#f8f3ed] text-[#030105] py-3">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <p className="text-sm">© 2024 Rosel Frozen Meat Supplier. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
};

export default Footer;
