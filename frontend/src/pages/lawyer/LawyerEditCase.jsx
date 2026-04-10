import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import { casesService } from "../../api/dataService";
import { LoadingState, ErrorState } from "../../components/common/States";

const EDITABLE_STATUSES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'];

const PROPERTY_TYPES = [
    "Residential", "Commercial", "Industrial", "Land", "Rural", "Other"
];

export default function LawyerEditCase() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [saveError, setSaveError] = useState(null);
    const [caseData, setCaseData] = useState(null);
    const [form, setForm] = useState({
        title: "",
        property_address: "",
        property_type: "Residential",
        estimated_value: "",
        outstanding_debt: "",
        interest_rate: "",
        description: "",
    });

    useEffect(() => {
        const load = async () => {
            try {
                const res = await casesService.getCaseById(id);
                if (res.success && res.data) {
                    const c = res.data;
                    if (!EDITABLE_STATUSES.includes(c.status)) {
                        setError(`This case (status: ${c.status}) cannot be edited.`);
                        return;
                    }
                    setCaseData(c);
                    setForm({
                        title: c.title || "",
                        property_address: c.property_address || "",
                        property_type: c.property_type || "Residential",
                        estimated_value: c.estimated_value ? String(c.estimated_value) : "",
                        outstanding_debt: c.outstanding_debt ? String(c.outstanding_debt) : "",
                        interest_rate: c.interest_rate ? String(c.interest_rate) : "",
                        description: c.description || "",
                    });
                } else {
                    setError("Case not found.");
                }
            } catch (err) {
                setError(err.message || "Failed to load case.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (saveError) setSaveError(null);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.property_address.trim()) {
            setSaveError("Title and Property Address are required.");
            return;
        }
        setSaving(true);
        setSaveError(null);
        try {
            const payload = {
                title: form.title.trim(),
                property_address: form.property_address.trim(),
                property_type: form.property_type,
                estimated_value: Number(form.estimated_value) || 0,
                outstanding_debt: Number(form.outstanding_debt) || 0,
                interest_rate: form.interest_rate ? Number(form.interest_rate) : undefined,
                description: form.description.trim() || undefined,
            };
            const res = await casesService.updateCase(id, payload);
            if (res.success) {
                navigate("/lawyer/my-cases");
            } else {
                setSaveError(res.error || "Failed to save case.");
            }
        } catch (err) {
            setSaveError(err.message || "An error occurred while saving.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-6"><LoadingState /></div>;
    if (error) return (
        <div className="p-6">
            <ErrorState message={error} />
            <button onClick={() => navigate("/lawyer/my-cases")} className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
                <ArrowLeft size={16} /> Back to My Cases
            </button>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-5 pb-10">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate("/lawyer/my-cases")} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-lg font-semibold text-slate-900">Edit Case</h1>
                    <p className="text-xs text-slate-500">{caseData?.case_number || id}</p>
                </div>
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded">
                    {caseData?.status}
                </span>
            </div>

            <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                <div className="p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-slate-800">Case Details</h2>

                    <Field label="Case Title" required>
                        <input name="title" value={form.title} onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                            placeholder="e.g., 12 Sample St Melbourne" />
                    </Field>

                    <Field label="Property Address" required>
                        <input name="property_address" value={form.property_address} onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                            placeholder="Full street address" />
                    </Field>

                    <Field label="Property Type">
                        <select name="property_type" value={form.property_type} onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                            {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </Field>
                </div>

                <div className="p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-slate-800">Financial Details</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Estimated Value (A$)">
                            <input name="estimated_value" type="number" min="0" step="1000" value={form.estimated_value} onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                                placeholder="e.g., 850000" />
                        </Field>
                        <Field label="Outstanding Debt (A$)">
                            <input name="outstanding_debt" type="number" min="0" step="1000" value={form.outstanding_debt} onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                                placeholder="e.g., 620000" />
                        </Field>
                    </div>

                    <Field label="Interest Rate (%)">
                        <input name="interest_rate" type="number" min="0" max="100" step="0.01" value={form.interest_rate} onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                            placeholder="e.g., 5.25" />
                    </Field>
                </div>

                <div className="p-5 space-y-4">
                    <Field label="Description">
                        <textarea name="description" value={form.description} onChange={handleChange} rows={4}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 resize-none"
                            placeholder="Additional case notes..." />
                    </Field>
                </div>

                {saveError && (
                    <div className="mx-5 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{saveError}</p>
                    </div>
                )}

                <div className="p-5 flex items-center justify-end gap-3">
                    <button type="button" onClick={() => navigate("/lawyer/my-cases")}
                        className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60">
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function Field({ label, required, children }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
        </div>
    );
}
