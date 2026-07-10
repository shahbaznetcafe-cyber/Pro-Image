import { createClient } from "@/lib/supabase/server";

type ImageJob = {
  id: string;
  job_type: string;
  original_filename: string | null;
  output_count: number | null;
  total_output_size_kb: number | null;
  status: string;
  created_at: string;
};

export default async function JobsPage() {
  const supabase = await createClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: jobs } = await supabase
    .from("seller_image_jobs")
    .select(
      "id,job_type,original_filename,output_count,total_output_size_kb,status,created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(25)
    .returns<ImageJob[]>();

  return (
    <section className="rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold">Job History</h2>
      <p className="mt-1 text-sm text-[#637063]">
        Metadata only. Product images are not permanently stored.
      </p>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#dce4d8] text-[#637063]">
              <th className="py-3 pr-4 font-semibold">Type</th>
              <th className="py-3 pr-4 font-semibold">File</th>
              <th className="py-3 pr-4 font-semibold">Outputs</th>
              <th className="py-3 pr-4 font-semibold">Size</th>
              <th className="py-3 pr-4 font-semibold">Status</th>
              <th className="py-3 pr-4 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {(jobs ?? []).map((job) => (
              <tr key={job.id} className="border-b border-[#eef2ed]">
                <td className="py-3 pr-4 font-medium">{job.job_type}</td>
                <td className="py-3 pr-4">{job.original_filename ?? "Image"}</td>
                <td className="py-3 pr-4">{job.output_count ?? 0}</td>
                <td className="py-3 pr-4">{job.total_output_size_kb ?? 0} KB</td>
                <td className="py-3 pr-4 capitalize">{job.status}</td>
                <td className="py-3 pr-4">
                  {new Date(job.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {jobs?.length === 0 ? (
          <div className="mt-5 rounded-md bg-[#edf3eb] px-4 py-3 text-sm text-[#314632]">
            No jobs yet. Generate your first seller pack from the homepage.
          </div>
        ) : null}
      </div>
    </section>
  );
}
