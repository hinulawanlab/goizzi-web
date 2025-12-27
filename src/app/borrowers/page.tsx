import Sidebar from "@/components/navigation/Sidebar";
import BorrowerDirectory from "@/components/borrowers/BorrowerDirectory";
import BorrowerFollowUpGateModal from "@/components/borrowers/BorrowerFollowUpGateModal";
import { getBorrowerFollowUps, getBorrowerSummaries } from "@/shared/services/borrowerService";

export default async function BorrowersPage() {
  const borrowers = await getBorrowerSummaries(30);
  const followUps = await getBorrowerFollowUps(50);

  return (
    <div className="min-h-screen bg-transparent px-4 py-8 text-slate-900">
      <Sidebar />
      <div className="mx-auto w-full max-w-8xl">
        <main className="space-y-6 pl-72">
          {/* <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-lg">
            </div> */}
          <BorrowerFollowUpGateModal followUps={followUps} />
          <BorrowerDirectory borrowers={borrowers} />
        </main>
      </div>
    </div>
  );
}
