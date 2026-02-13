import Link from "next/link";
import CookieBanner from "./CookieBanner";

const Footer = () => {
  return (
    <footer className="w-full bg-slate-950  py-8 relative z-10">
      <CookieBanner />
      <div className="container mx-auto px-4 text-center">
        <p className="text-gray-400 font-medium mb-2">
          &copy; {new Date().getFullYear()} <span className="text-white font-bold">AP Hogeschool</span>
          <span className="mx-2 text-gray-700">|</span>
          <Link href="/privacy" className="text-gray-500 hover:text-white text-sm transition-colors">
            Privacybeleid
          </Link>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
