import { Package } from "lucide-react";

export default function RFQCanvassing() {
  return (
    <div className="p-6 space-y-5">
      <div><h1 className="text-2xl font-bold text-slate-900">RFQ & Canvassing</h1><p className="text-sm text-slate-500 mt-1">Multi-vendor Quotes · Price/Spec Comparison · Auto Ranking</p></div>
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
        <h3 className="font-semibold text-slate-700">RFQ & Canvassing Module</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">Request for quotations from multiple vendors, compare prices and specifications side-by-side, and automatically rank suppliers by best value. Link RFQs to material requests for seamless procurement workflow.</p>
      </div>
    </div>
  );
}