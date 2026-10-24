import { AuthForm } from "@/components/auth-form";
import { getSupabaseConfig } from "@/lib/supabase/config";

export default function LoginPage() {
  return <AuthForm mode="login" configured={Boolean(getSupabaseConfig())} />;
}
