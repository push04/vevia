import { redirect } from "next/navigation";

// /candidate/register redirects to /candidate/login which has both sign-in and sign-up modes
export default function CandidateRegisterPage() {
  redirect("/candidate/login");
}
