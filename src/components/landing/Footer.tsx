import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import logoImage from "@/assets/logo-brocode.jpeg";

const Footer = () => {
  const footerLinks = {
    product: [
      { name: "Fitur", path: "/#features" },
      { name: "Harga", path: "/pricing" },
      { name: "Demo", path: "/demo" },
      { name: "Integrasi", path: "/integrations" },
    ],
    company: [
      { name: "Tentang Kami", path: "/about" },
      { name: "Karir", path: "/careers" },
      { name: "Blog", path: "/blog" },
      { name: "Kontak", path: "/contact" },
    ],
    support: [
      { name: "Pusat Bantuan", path: "/help" },
      { name: "Dokumentasi", path: "/docs" },
      { name: "Status Sistem", path: "/status" },
      { name: "API", path: "/api" },
    ],
    legal: [
      { name: "Privasi", path: "/privacy" },
      { name: "Syarat & Ketentuan", path: "/terms" },
      { name: "Kebijakan Cookie", path: "/cookies" },
    ],
  };

  const socialLinks = [
    { icon: <Facebook className="w-5 h-5" />, path: "#" },
    { icon: <Instagram className="w-5 h-5" />, path: "#" },
    { icon: <Twitter className="w-5 h-5" />, path: "#" },
    { icon: <Youtube className="w-5 h-5" />, path: "#" },
  ];

  return (
    <footer className="bg-sidebar text-sidebar-foreground pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={logoImage} alt="BroCodeID Logo" className="h-10 w-auto" />
            </Link>
            <p className="text-sidebar-foreground/70 text-sm mb-6 max-w-xs">
              Platform LMS dan CBT terdepan untuk SMK dan Universitas di
              Indonesia. Transformasi digital pembelajaran dimulai dari sini.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.path}
                  className="w-10 h-10 rounded-lg bg-sidebar-accent flex items-center justify-center hover:bg-sidebar-primary transition-colors"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Produk</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Perusahaan</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Dukungan</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-sidebar-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-sidebar-foreground/60">
            © 2026 BroCodeID. Hak cipta dilindungi.
          </p>
          <p className="text-sm text-sidebar-foreground/60">
            Dibuat dengan ❤️ di Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
