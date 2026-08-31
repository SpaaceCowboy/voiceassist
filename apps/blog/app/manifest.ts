import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Termspace",
    short_name: "Termspace",
    description: "An independent editorial journal on software, design, and technology.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f7",
    theme_color: "#b45309",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
