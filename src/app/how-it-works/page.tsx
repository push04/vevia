import { Metadata } from "next";
import AnimatedContent from "./AnimatedContent";

export const metadata: Metadata = {
  title: "How It Works | Vevia",
  description: "See how Vevia automates your hiring process with AI parsing, screening, and scoring.",
};

export default function HowItWorksPage() {
  return <AnimatedContent />;
}
