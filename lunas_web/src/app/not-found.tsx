import type { Metadata } from "next";
import { PublicNotFound } from "@/components/support/public-not-found";

export const metadata: Metadata = { title: "Page Not Found" };

export default function NotFoundPage() {
  return <PublicNotFound />;
}
