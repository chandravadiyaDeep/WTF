import { redirect } from "next/navigation";
import DatasetDashboard from "@/components/dataset-dashboard";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function WorkspacePage() {
  if (!getSupabaseConfig()) redirect("/login?setup=required");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership, error: membershipError } = await supabase.from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const workspaceId = membership?.workspace_id;
  const { data: savedDatasets, error: datasetsError } = workspaceId
    ? await supabase.from("datasets").select("id,name,source_filename,source_object_key,byte_size,row_count,column_count,profile,current_version_number,created_at")
      .eq("workspace_id", workspaceId).eq("status", "ready").order("updated_at", { ascending: false }).limit(12)
    : { data: null, error: membershipError };
  const setupMessage = membershipError || datasetsError || !workspaceId
    ? "Apply the Supabase migration to enable private workspace history. You can still analyze data in this browser."
    : undefined;
  return <DatasetDashboard accountEmail={user.email ?? "Signed in"} workspaceId={workspaceId} savedDatasets={savedDatasets ?? []} workspaceMessage={setupMessage} />;
}
