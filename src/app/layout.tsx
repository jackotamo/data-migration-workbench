import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Migration Workbench | Jack Tam", description: "A local-first data migration and validation workbench. Map. Validate. Reconcile." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
