import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata = {
  title: "NeuroSpine — Voice Assistant Dashboard",
  description: "Operations dashboard for the NeuroSpine Institute AI voice assistant.",
};

// Runs before first paint to set the theme class, eliminating the
// light/dark flash (FOUC) when a returning user has chosen dark mode.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}var r=document.documentElement;if(t==='dark'){r.classList.add('dark');}else{r.classList.remove('dark');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
