import { migrate } from "@/lib/migrate";

export default function RootLayout({ children }) {
  // Run DB migrations once
  migrate();

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
