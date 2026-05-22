export const siteConfig = {
  name: "Ginola",
  title: "AI-Powered Full Stack Developer",
  description:
    "Full Stack Developer building scalable, secure web apps — increasingly powered by AI. Based in Jakarta/Tangerang, working remote-first.",
  url: "https://ginola.dev",
  ogImage: "/og.png",
  links: {
    github: "https://github.com/mhdginola",
    linkedin: "https://linkedin.com/in/ginola-ginola",
    twitter: "https://github.com/mhdginola",
    email: "mhdginola@gmail.com",
    phone: "+62 822-7969-9303",
  },
  nav: [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/projects", label: "Projects" },
    { href: "/playground", label: "AI Playground" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
