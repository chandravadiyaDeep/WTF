import { AuthForm } from "@/components/auth-form";
import { getSupabaseConfig } from "@/lib/supabase/config";

export default function ForgotPasswordPage() {
  return <AuthForm mode="forgot" configured={Boolean(getSupabaseConfig())} />;
}
