import { AuthForm } from "@/components/auth-form";
import { getSupabaseConfig } from "@/lib/supabase/config";

export default function UpdatePasswordPage() {
  return <AuthForm mode="update-password" configured={Boolean(getSupabaseConfig())} />;
}
