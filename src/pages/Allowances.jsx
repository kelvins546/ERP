import { useState, useEffect } from "react";
import { supabase } from "@/api/base44Client";
import {
  Plus,
  Edit,
  Power,
  X,
  Search,
  ChevronsRight,
  Eye,
  EyeOff,
  FileText,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- STATUS TOGGLE CONFIRMATION MODAL ---
function StatusToggleModal({ isOpen, item, onClose, onConfirm }) {
  if (!isOpen || !item) return null;
  const isDeactivating = item.is_active;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">
            {isDeactivating ? "Deactivate" : "Activate"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-8">
          Do you want to {isDeactivating ? "deactivate" : "activate"}{" "}
          <span className="font-bold">{item.name}</span>?
        </p>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-slate-100 border-transparent hover:bg-slate-200 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(item)}
            className={`rounded-xl ${isDeactivating ? "bg-red-600 hover:bg-red-700 text-white" : "bg-[#2E6F40] hover:bg-[#235330] text-white"}`}
          >
            {isDeactivating ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- HUMAN-FRIENDLY PAYROLL ITEM MODAL WITH TARGETING ---
function PayrollItemModal({ item, employeesList, onClose, onSaved }) {
  let initialCalcType = "fixed";
  let initialAmount = "0";
  let initialTiming = "every_cutoff";

  if (item) {
    if ((item.amount_or_formula || "").includes("basic_salary *")) {
      initialCalcType = "percentage";
      initialAmount = String(
        Number(item.amount_or_formula.replace("basic_salary *", "").trim()) *
          100,
      );
    } else {
      initialAmount = item.amount_or_formula || "0";
    }
    initialTiming =
      item.frequencies && item.frequencies.length > 0
        ? item.frequencies[0]
        : "every_cutoff";
  }

  const [form, setForm] = useState({
    name: item?.name || "",
    type: item?.type || "Deduction",
    target_type: item?.target_type || "all",
    assigned_employee_ids: item?.assigned_employee_ids || [],
  });

  const [calcType, setCalcType] = useState(initialCalcType);
  const [amountValue, setAmountValue] = useState(initialAmount);
  const [timing, setTiming] = useState(initialTiming);
  const [saving, setSaving] = useState(false);

  const handleToggleEmployee = (empId) => {
    setForm((prev) => {
      const current = prev.assigned_employee_ids || [];
      if (current.includes(empId))
        return {
          ...prev,
          assigned_employee_ids: current.filter((id) => id !== empId),
        };
      return { ...prev, assigned_employee_ids: [...current, empId] };
    });
  };

  const handleSave = async () => {
    if (!form.name || !amountValue)
      return alert("Please fill in all required fields.");
    if (
      form.target_type === "specific" &&
      form.assigned_employee_ids.length === 0
    ) {
      return alert("Please select at least one employee.");
    }

    setSaving(true);
    try {
      let finalFormula = String(amountValue);
      if (calcType === "percentage") {
        finalFormula = `basic_salary * ${Number(amountValue) / 100}`;
      }

      const payload = {
        name: form.name,
        type: form.type,
        visibility: "always",
        is_uploadable: false,
        amount_or_formula: finalFormula,
        frequencies: [timing],
        target_type: form.target_type,
        assigned_employee_ids:
          form.target_type === "all" ? [] : form.assigned_employee_ids,
      };

      if (item?.id) {
        const { error } = await supabase
          .from("payroll_items")
          .update(payload)
          .eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("payroll_items")
          .insert([payload]);
        if (error) throw error;
      }
      onSaved();
    } catch (error) {
      alert("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
        <div className="flex items-center justify-between p-6 border-b bg-white shrink-0">
          <h2 className="text-xl font-bold text-slate-900">
            {item ? "Edit Payroll Item" : "Add Payroll Item"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto bg-slate-50/50">
          {/* Target Assignment */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Target Assignment *
              </label>
              <select
                className="mt-2 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#2E6F40] transition-shadow font-semibold text-slate-800"
                value={form.target_type}
                onChange={(e) =>
                  setForm({ ...form, target_type: e.target.value })
                }
              >
                <option value="all">Apply to All Employees</option>
                <option value="specific">
                  Apply to Specific Employees Only
                </option>
              </select>
            </div>

            {form.target_type === "specific" && (
              <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                <div className="bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 border-b flex justify-between">
                  <span>Select Employees</span>
                  <span className="text-[#2E6F40]">
                    {form.assigned_employee_ids.length} selected
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto p-1 divide-y divide-slate-100 bg-white">
                  {employeesList.map((emp) => (
                    <label
                      key={emp.id}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={form.assigned_employee_ids.includes(emp.id)}
                        onChange={() => handleToggleEmployee(emp.id)}
                        className="w-4 h-4 text-[#2E6F40] border-slate-300 rounded focus:ring-[#2E6F40]"
                      />
                      <span className="text-sm font-medium text-slate-800">
                        {emp.first_name} {emp.last_name}
                      </span>
                    </label>
                  ))}
                  {employeesList.length === 0 && (
                    <p className="text-xs text-center py-4 text-slate-400">
                      Loading employees...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Basic Details */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600">
                Item Name *
              </label>
              <Input
                className="mt-1.5 border-slate-200 focus-visible:ring-[#2E6F40] rounded-xl"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Rice Subsidy, Health Insurance..."
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">
                What type of item is this? *
              </label>
              <select
                className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E6F40] transition-shadow"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="Benefit">Benefit (Adds to Pay)</option>
                <option value="Allowance">Allowance (Adds to Pay)</option>
                <option value="Deduction">
                  Deduction (Subtracts from Pay)
                </option>
                <option value="Employer Contribution">
                  Employer Contribution (Company Pays)
                </option>
              </select>
            </div>
          </div>

          <div className="w-full h-px bg-slate-200"></div>

          {/* Money Math (Simplified) */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600">
                How is this calculated? *
              </label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <button
                  className={`py-2 px-3 text-sm font-semibold rounded-xl border transition-colors ${calcType === "fixed" ? "bg-[#2E6F40]/10 border-[#2E6F40] text-[#2E6F40]" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}
                  onClick={() => setCalcType("fixed")}
                >
                  Fixed Amount
                </button>
                <button
                  className={`py-2 px-3 text-sm font-semibold rounded-xl border transition-colors ${calcType === "percentage" ? "bg-[#2E6F40]/10 border-[#2E6F40] text-[#2E6F40]" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}
                  onClick={() => setCalcType("percentage")}
                >
                  Percentage (%)
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">
                {calcType === "fixed"
                  ? "Enter Fixed Amount (₱) *"
                  : "Enter Percentage of Basic Pay (%) *"}
              </label>
              <Input
                type="number"
                className="mt-1.5 border-slate-200 focus-visible:ring-[#2E6F40] rounded-xl font-mono"
                value={amountValue}
                onChange={(e) => setAmountValue(e.target.value)}
                placeholder={calcType === "fixed" ? "0.00" : "5"}
              />
            </div>
          </div>

          <div className="w-full h-px bg-slate-200"></div>

          {/* Timing (Simplified) */}
          <div>
            <label className="text-xs font-bold text-slate-600">
              When does this apply? *
            </label>
            <select
              className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E6F40] transition-shadow"
              value={timing}
              onChange={(e) => setTiming(e.target.value)}
            >
              <option value="every_cutoff">Every Cutoff (15th & 30th)</option>
              <option value="first_cutoff">1st Cutoff Only (15th)</option>
              <option value="second_cutoff">2nd Cutoff Only (30th)</option>
              <option value="monthly">Once a Month</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-white shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl px-6"
          >
            Cancel
          </Button>
          <Button
            className="bg-[#2E6F40] hover:bg-[#235330] text-white rounded-xl shadow-md px-8 font-bold"
            onClick={handleSave}
            disabled={saving || !form.name || !amountValue}
          >
            {saving ? "Saving..." : "Save Item"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN LIST PAGE ---
export default function BenefitsAndDeductions() {
  const [items, setItems] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [itemToToggle, setItemToToggle] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payroll_items")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      setItems(data || []);

      const { data: empData } = await supabase
        .from("employees")
        .select("id, first_name, last_name, employee_code")
        .order("first_name", { ascending: true });
      if (empData) setEmployeesList(empData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (item) => {
    try {
      const { error } = await supabase
        .from("payroll_items")
        .update({ is_active: !item.is_active })
        .eq("id", item.id);

      if (error) throw error;
      setShowStatusModal(false);
      setItemToToggle(null);
      loadData();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesType = filterType ? item.type === filterType : true;
    const matchesStatus =
      filterStatus === ""
        ? true
        : filterStatus === "active"
          ? item.is_active
          : !item.is_active;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeIcon = (type) => {
    if (type === "Deduction")
      return (
        <div className="w-5 h-5 bg-red-100 text-red-700 rounded flex items-center justify-center font-bold text-sm leading-none">
          -
        </div>
      );
    if (type === "Allowance" || type === "Benefit")
      return (
        <div className="w-5 h-5 bg-green-100 text-green-700 rounded flex items-center justify-center font-bold text-sm leading-none">
          +
        </div>
      );
    if (type === "Employer Contribution")
      return <ChevronsRight className="w-5 h-5 text-blue-500" />;
    return null;
  };

  const formatAmount = (val) => {
    if (!val) return "₱0.00";
    if (val.includes("basic_salary *")) {
      const pct = Number(val.replace("basic_salary *", "").trim()) * 100;
      return `${pct}% of Basic Pay`;
    }
    return `₱${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const formatTiming = (freqs) => {
    if (!freqs || !freqs.length) return "Every Cutoff";
    const f = freqs[0];
    if (f === "first_cutoff" || f === "Week 1" || f === "Week 2")
      return "1st Cutoff";
    if (f === "second_cutoff" || f === "Week 3" || f === "Week 4")
      return "2nd Cutoff";
    if (f === "monthly") return "Once a Month";
    return "Every Cutoff";
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2E6F40]/10 text-[#2E6F40] rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            Benefits & Deductions
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-14">
            Configure standard additions and subtractions for payroll
            generation.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-[#2E6F40] hover:bg-[#235330] text-white shadow-sm rounded-xl px-5 gap-2"
            onClick={() => {
              setEditItem(null);
              setShowModal(true);
            }}
          >
            <Plus className="w-4 h-4" /> New Payroll Item
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search items..."
            className="pl-9 bg-white border-slate-200 rounded-xl focus-visible:ring-[#2E6F40]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm bg-white text-slate-600 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-[#2E6F40]"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="Deduction">Deductions</option>
          <option value="Allowance">Allowances</option>
          <option value="Benefit">Benefits</option>
          <option value="Employer Contribution">Employer Contributions</option>
        </select>
        <select
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm bg-white text-slate-600 min-w-[150px] focus:outline-none focus:ring-2 focus:ring-[#2E6F40]"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-slate-500 w-16">
                  #
                </th>
                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">
                  Payroll Item
                </th>
                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-slate-500 w-24">
                  Type
                </th>
                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">
                  Target
                </th>
                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">
                  Amount / Math
                </th>
                <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">
                  Frequency
                </th>
                <th className="px-4 py-4 w-16 text-center font-bold text-[11px] uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-6 py-4 w-28 text-center font-bold text-[11px] uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="w-8 h-8 border-4 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-16 text-slate-400 font-medium"
                  >
                    No items found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`transition-colors group ${item.is_active ? "hover:bg-slate-50" : "bg-slate-50/50 opacity-60 hover:opacity-100"}`}
                  >
                    <td className="px-6 py-4 text-slate-400 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="text-xs font-semibold text-slate-600">
                          {item.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {item.target_type === "specific" ? (
                        <span className="text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-md">
                          {(item.assigned_employee_ids || []).length} Employees
                        </span>
                      ) : (
                        <span className="text-slate-500">All Employees</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {formatAmount(item.amount_or_formula)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {formatTiming(item.frequencies)}
                    </td>

                    {/* Status Dot */}
                    <td className="px-4 py-4 text-center">
                      <div
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${item.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}
                      >
                        {item.is_active ? "Active" : "Inactive"}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditItem(item);
                            setShowModal(true);
                          }}
                          className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-[#2E6F40] hover:bg-[#2E6F40]/10 hover:border-[#2E6F40]/30 transition-all"
                          title="Edit Item"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setItemToToggle(item);
                            setShowStatusModal(true);
                          }}
                          className={`p-1.5 border rounded-lg transition-all ${item.is_active ? "border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200" : "border-slate-200 text-slate-500 hover:text-green-600 hover:bg-green-50 hover:border-green-200"}`}
                          title={item.is_active ? "Deactivate" : "Activate"}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <PayrollItemModal
          item={editItem}
          employeesList={employeesList}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            loadData();
          }}
        />
      )}

      <StatusToggleModal
        isOpen={showStatusModal}
        item={itemToToggle}
        onClose={() => setShowStatusModal(false)}
        onConfirm={handleToggleStatus}
      />
    </div>
  );
}
