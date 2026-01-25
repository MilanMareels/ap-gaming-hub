const Footer = () => {
  return (
    <footer className="w-full bg-slate-950  py-8 relative z-10">
      <div className="container mx-auto px-4 text-center">
        <p className="text-gray-400 font-medium mb-2">
          &copy; {new Date().getFullYear()} <span className="text-white font-bold">AP Hogeschool</span>
        </p>
        <p className="text-gray-600 text-sm">
          Ontwikkeld door{" "}
          <a href="https://milanmareels.be" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-500 transition-colors font-bold">
            Milan Mareels
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
