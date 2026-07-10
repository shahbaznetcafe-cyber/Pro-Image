import { ManualPaymentForm } from "@/components/manual-payment-form";
import { createClient } from "@/lib/supabase/server";

export default async function BillingPage() {
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

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Manual Payment Activation</h2>
        <p className="mt-2 text-sm leading-6 text-[#637063]">
          Pakistan launch ke liye JazzCash, Easypaisa, ya bank transfer request
          submit karen. Admin payment verify karke plan active karega.
        </p>
        <div className="mt-5">
          <ManualPaymentForm userId={user.id} />
        </div>
      </div>

      <aside className="h-fit rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
        <h3 className="font-semibold">Admin process</h3>
        <ol className="mt-3 space-y-3 text-sm leading-6 text-[#637063]">
          <li>1. User payment request submit karta hai.</li>
          <li>2. Admin transaction verify karta hai.</li>
          <li>3. Secure approval plan aur subscription atomically activate karti hai.</li>
          <li>4. Nayi usage limit foran dashboard mein reflect hoti hai.</li>
        </ol>
      </aside>
    </section>
  );
}
