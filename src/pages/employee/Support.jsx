import { useEffect, useState } from "react";
import { supabase } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  LifeBuoy,
  MessageSquare,
  Plus,
  ChevronDown,
  Clock,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ESSSupport() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("tickets"); // 'tickets' or 'faqs'

  const [tickets, setTickets] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ticket Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    category: "",
    subject: "",
    description: "",
  });

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState(null);

  const fetchData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [ticketsRes, faqsRes] = await Promise.all([
        supabase
          .from("support_tickets")
          .select("*")
          .eq("employee_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("faqs")
          .select("*")
          .order("category", { ascending: true }),
      ]);

      if (ticketsRes.error && ticketsRes.error.code !== "42P01")
        console.error(ticketsRes.error); // 42P01 = table doesn't exist
      if (faqsRes.error && faqsRes.error.code !== "42P01")
        console.error(faqsRes.error);

      setTickets(ticketsRes.data || []);
      setFaqs(faqsRes.data || []);
    } catch (error) {
      console.error("Error fetching support data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const submitTicket = async (e) => {
    e.preventDefault();
    if (!ticketForm.category || !ticketForm.subject || !ticketForm.description)
      return alert("Fill all fields.");

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("support_tickets").insert([
        {
          employee_id: user.id,
          category: ticketForm.category,
          subject: ticketForm.subject,
          description: ticketForm.description,
          status: "open",
        },
      ]);

      if (error) throw error;
      alert("Ticket submitted successfully!");
      setTicketForm({ category: "", subject: "", description: "" });
      fetchData();
    } catch (error) {
      alert(
        "Failed to submit ticket. Ensure you ran the Support SQL script! Error: " +
          error.message,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "resolved":
      case "closed":
        return "bg-green-100 text-green-700";
      case "in_progress":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Help & Support
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Create an IT/HR ticket or browse frequently asked questions.
        </p>
      </div>

      <div className="flex gap-2 p-1 bg-slate-200/50 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("tickets")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "tickets" ? "bg-white text-[#2E6F40] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <LifeBuoy className="w-4 h-4" /> My Tickets
        </button>
        <button
          onClick={() => setActiveTab("faqs")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "faqs" ? "bg-white text-[#2E6F40] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <MessageSquare className="w-4 h-4" /> FAQs
        </button>
      </div>

      {activeTab === "tickets" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#2E6F40]" /> Open a Ticket
              </h3>
              <form onSubmit={submitTicket} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Category
                  </label>
                  <Select
                    value={ticketForm.category}
                    onValueChange={(val) =>
                      setTicketForm({ ...ticketForm, category: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select dept" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HR">Human Resources</SelectItem>
                      <SelectItem value="IT">IT Support</SelectItem>
                      <SelectItem value="Payroll">Payroll</SelectItem>
                      <SelectItem value="Facilities">Facilities</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Subject
                  </label>
                  <Input
                    placeholder="Brief summary of issue"
                    value={ticketForm.subject}
                    onChange={(e) =>
                      setTicketForm({ ...ticketForm, subject: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Description
                  </label>
                  <textarea
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm focus-visible:outline-[#2E6F40]"
                    rows="4"
                    placeholder="Provide details..."
                    value={ticketForm.description}
                    onChange={(e) =>
                      setTicketForm({
                        ...ticketForm,
                        description: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#2E6F40] hover:bg-[#235330]"
                >
                  {isSubmitting ? "Submitting..." : "Submit Ticket"}
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#2E6F40]" /> Ticket History
              </h3>
              <div className="space-y-3">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin"></div>
                  </div>
                ) : tickets.length === 0 ? (
                  <p className="text-center text-slate-500 py-10 bg-slate-50 rounded-xl">
                    No support tickets filed yet.
                  </p>
                ) : (
                  tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 bg-white border border-slate-200 rounded-xl flex items-start gap-4 hover:border-[#2E6F40]/30 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center bg-slate-100 text-slate-600 rounded-lg w-12 h-12 shrink-0">
                        <span className="text-[10px] font-bold uppercase">
                          {ticket.category}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-slate-900">
                            {ticket.subject}
                          </p>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getStatusColor(ticket.status)}`}
                          >
                            {ticket.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">
                          Filed on{" "}
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {ticket.description}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "faqs" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6 bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100">
            <Info className="w-5 h-5 shrink-0" />
            <p className="text-sm">
              Browse common questions below. If you can't find your answer,
              switch to the Tickets tab to ask HR or IT directly.
            </p>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin"></div>
              </div>
            ) : faqs.length === 0 ? (
              <p className="text-center text-slate-500 py-10 bg-slate-50 rounded-xl">
                No FAQs available yet. HR is still building the knowledge base.
              </p>
            ) : (
              faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="border border-slate-200 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setOpenFaq(openFaq === faq.id ? null : faq.id)
                    }
                    className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors text-left"
                  >
                    <span className="font-bold text-slate-800">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === faq.id ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openFaq === faq.id && (
                    <div className="p-4 bg-slate-50 border-t border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
