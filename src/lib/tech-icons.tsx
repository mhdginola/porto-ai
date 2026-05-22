import {
  SiBootstrap,
  SiCss,
  SiDocker,
  SiExpress,
  SiFigma,
  SiGit,
  SiGithub,
  SiGo,
  SiGooglecloud,
  SiHtml5,
  SiJavascript,
  SiJquery,
  SiKubernetes,
  SiLaravel,
  SiMongodb,
  SiMysql,
  SiNextdotjs,
  SiNodedotjs,
  SiOllama,
  SiOpenai,
  SiPhp,
  SiPostgresql,
  SiPython,
  SiReact,
  SiTailwindcss,
  SiTypescript,
  SiVercel,
  SiVuedotjs,
} from "react-icons/si";
import type { IconType } from "react-icons";

export type TechMeta = {
  icon: IconType;
  /** Brand color from simpleicons.org. Undefined = use currentColor (theme adaptive). */
  color?: string;
};

const map: Record<string, TechMeta> = {
  // languages
  typescript: { icon: SiTypescript, color: "#3178C6" },
  javascript: { icon: SiJavascript, color: "#F7DF1E" },
  go: { icon: SiGo, color: "#00ADD8" },
  golang: { icon: SiGo, color: "#00ADD8" },
  python: { icon: SiPython, color: "#3776AB" },
  php: { icon: SiPhp, color: "#777BB4" },
  html: { icon: SiHtml5, color: "#E34F26" },
  html5: { icon: SiHtml5, color: "#E34F26" },
  css: { icon: SiCss, color: "#1572B6" },
  css3: { icon: SiCss, color: "#1572B6" },

  // frameworks / libs
  react: { icon: SiReact, color: "#61DAFB" },
  "react.js": { icon: SiReact, color: "#61DAFB" },
  "react js": { icon: SiReact, color: "#61DAFB" },
  "next.js": { icon: SiNextdotjs }, // adaptive (black/white)
  nextjs: { icon: SiNextdotjs },
  next: { icon: SiNextdotjs },
  "vue.js": { icon: SiVuedotjs, color: "#4FC08D" },
  vuejs: { icon: SiVuedotjs, color: "#4FC08D" },
  vue: { icon: SiVuedotjs, color: "#4FC08D" },
  "node.js": { icon: SiNodedotjs, color: "#5FA04E" },
  nodejs: { icon: SiNodedotjs, color: "#5FA04E" },
  node: { icon: SiNodedotjs, color: "#5FA04E" },
  "express.js": { icon: SiExpress }, // adaptive
  express: { icon: SiExpress },
  laravel: { icon: SiLaravel, color: "#FF2D20" },
  "tailwind css": { icon: SiTailwindcss, color: "#06B6D4" },
  tailwindcss: { icon: SiTailwindcss, color: "#06B6D4" },
  tailwind: { icon: SiTailwindcss, color: "#06B6D4" },
  bootstrap: { icon: SiBootstrap, color: "#7952B3" },
  jquery: { icon: SiJquery, color: "#0769AD" },

  // databases
  postgresql: { icon: SiPostgresql, color: "#4169E1" },
  postgres: { icon: SiPostgresql, color: "#4169E1" },
  mysql: { icon: SiMysql, color: "#4479A1" },
  mongodb: { icon: SiMongodb, color: "#47A248" },
  mongo: { icon: SiMongodb, color: "#47A248" },

  // ai
  openai: { icon: SiOpenai }, // adaptive
  ollama: { icon: SiOllama }, // adaptive
  "vercel ai sdk": { icon: SiVercel }, // adaptive
  vercel: { icon: SiVercel },

  // devops / tools
  docker: { icon: SiDocker, color: "#2496ED" },
  kubernetes: { icon: SiKubernetes, color: "#326CE5" },
  "kubernetes (k8s)": { icon: SiKubernetes, color: "#326CE5" },
  k8s: { icon: SiKubernetes, color: "#326CE5" },
  "google cloud platform": { icon: SiGooglecloud, color: "#4285F4" },
  "google cloud": { icon: SiGooglecloud, color: "#4285F4" },
  gcp: { icon: SiGooglecloud, color: "#4285F4" },
  git: { icon: SiGit, color: "#F05032" },
  github: { icon: SiGithub }, // adaptive
  "git / github": { icon: SiGithub },
  "git/github": { icon: SiGithub },

  // design
  figma: { icon: SiFigma, color: "#F24E1E" },
};

export function getTechMeta(name: string): TechMeta | null {
  const key = name.toLowerCase().trim();
  return map[key] ?? null;
}
