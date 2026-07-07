import { useEffect, useMemo, useState } from 'react';
import { trpc } from '@/providers/trpc';
import { skipToken } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../../api/router';
import {
  Factory,
  Plus,
  Search,
  Star,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronDown,
  Package,
  X,
} from 'lucide-react';

type AdminOutputs = inferRouterOutputs<AppRouter>['admin'];
type FactoryListItem = AdminOutputs['factoryList']['items'][number];
type ProductItem = AdminOutputs['productList'][number];
type VerifiedFilter = 'true' | 'false' | 'all';
type FeaturedFilter = 'true' | 'false' | 'all';
type SortField = 'createdAt' | 'rating' | 'reviewCount' | 'name';
type SortOrder = 'asc' | 'desc';

const PAGE_SIZE = 10;
const SORTS: { value: `${SortField}-${SortOrder}`; label: string }[] = [
  { value: 'createdAt-desc', label: 'Newest' },
  { value: 'createdAt-asc', label: 'Oldest' },
  { value: 'rating-desc', label: 'Highest Rated' },
  { value: 'rating-asc', label: 'Lowest Rated' },
  { value: 'reviewCount-desc', label: 'Most Reviews' },
  { value: 'name-asc', label: 'Name A-Z' },
];

const VERIFIED_OPTIONS = [
  { value: 'all', label: 'All Verification' },
  { value: 'true', label: 'Verified' },
  { value: 'false', label: 'Not Verified' },
];

const FEATURED_OPTIONS = [
  { value: 'all', label: 'All Featured' },
  { value: 'true', label: 'Featured' },
  { value: 'false', label: 'Not Featured' },
];

const emptyForm = {
  name: '',
  slug: '',
  location: '',
  city: '',
  province: '',
  description: '',
  descriptionAr: '',
  logoUrl: '',
  heroImage: '',
  gallery: '',
  rating: '0',
  reviewCount: '0',
  yearsInBusiness: '0',
  capacity: '',
  moq: '',
  moqValue: '0',
  employees: '0',
  factorySize: '',
  isVerified: false,
  isComplianceCertified: false,
  isLeadTimeCertified: false,
  exportMarkets: '',
  primaryProducts: '',
  website: '',
  whatsapp: '',
  email: '',
  featured: false,
  categoryIds: [] as number[],
  certificateIds: [] as number[],
};

function MultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: number; label: string }[];
  value: number[];
  onChange: (ids: number[]) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none flex items-center justify-between"
        style={{ background: '#1A2744', border: '1px solid #243352' }}
      >
        <span className="truncate">{value.length > 0 ? `${value.length} selected` : `Select ${label.toLowerCase()}`}</span>
        <ChevronDown className="w-4 h-4" style={{ color: '#94A3B8' }} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-xl py-1" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
            {options.map((opt) => {
              const selected = value.includes(opt.id);
              return (
                <div
                  key={opt.id}
                  onClick={() => onChange(selected ? value.filter((id) => id !== opt.id) : [...value, opt.id])}
                  className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-white/5"
                  style={{ color: selected ? '#fff' : '#94A3B8' }}
                >
                  <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: selected ? '#E53935' : '#1A2744', border: '1px solid #243352' }}>
                    {selected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  {opt.label}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className="w-9 h-5 rounded-full relative transition-colors"
        style={{ background: checked ? '#66BB6A' : '#1A2744', border: '1px solid #243352' }}
      >
        <div className="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform" style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }} />
      </div>
      <span className="text-sm" style={{ color: '#94A3B8' }}>{label}</span>
    </label>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      {label && <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
        style={{ background: '#1A2744', border: '1px solid #243352' }}
      />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, required }: { label?: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-24 rounded-xl px-3 py-2 text-sm text-white outline-none resize-none"
        style={{ background: '#1A2744', border: '1px solid #243352' }}
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      {label && <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none appearance-none"
        style={{ background: '#1A2744', border: '1px solid #243352' }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function FactoriesPage() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [city, setCity] = useState('');
  const [isVerified, setIsVerified] = useState<VerifiedFilter>('all');
  const [featured, setFeatured] = useState<FeaturedFilter>('all');
  const [sort, setSort] = useState<`${SortField}-${SortOrder}`>('createdAt-desc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FactoryListItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const [sortBy, sortOrder] = sort.split('-') as [SortField, SortOrder];

  const { data: factoriesData, isLoading } = trpc.admin.factoryList.useQuery({
    search: debouncedSearch || undefined,
    categoryId: categoryId !== 'all' ? Number(categoryId) : undefined,
    city: city || undefined,
    isVerified,
    featured,
    sortBy,
    sortOrder,
    page,
    pageSize: PAGE_SIZE,
  });

  const { data: categories } = trpc.admin.categoryList.useQuery();
  const { data: certificates } = trpc.admin.certificateList.useQuery();
  const { data: editingProducts, refetch: refetchProducts } = trpc.admin.productList.useQuery(
    editing?.id ? { factoryId: editing.id } : skipToken
  );

  const create = trpc.admin.factoryCreate.useMutation({
    onSuccess: () => {
      utils.admin.factoryList.invalidate();
      setShowForm(false);
      setForm(emptyForm);
      setEditing(null);
    },
  });
  const update = trpc.admin.factoryUpdate.useMutation({
    onSuccess: () => {
      utils.admin.factoryList.invalidate();
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
    },
  });
  const del = trpc.admin.factoryDelete.useMutation({
    onSuccess: () => utils.admin.factoryList.invalidate(),
  });
  const bulk = trpc.admin.factoryBulkAction.useMutation({
    onSuccess: () => {
      utils.admin.factoryList.invalidate();
      setSelected([]);
    },
  });
  const productCreate = trpc.admin.productCreate.useMutation({
    onSuccess: () => refetchProducts(),
  });
  const productUpdate = trpc.admin.productUpdate.useMutation({
    onSuccess: () => refetchProducts(),
  });
  const productDelete = trpc.admin.productDelete.useMutation({
    onSuccess: () => refetchProducts(),
  });

  const categoryOptions = useMemo(
    () => (categories ?? []).map((c) => ({ id: Number(c.id), label: `${c.nameEn} / ${c.nameAr}` })),
    [categories]
  );
  const certificateOptions = useMemo(
    () => (certificates ?? []).map((c) => ({ id: Number(c.id), label: c.name })),
    [certificates]
  );
  const cityOptions = useMemo(() => {
    const set = new Set((factoriesData?.items ?? []).map((f) => f.city));
    return Array.from(set).sort();
  }, [factoriesData]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (f: FactoryListItem) => {
    setEditing(f);
    setForm({
      name: f.name || '',
      slug: f.slug || '',
      location: f.location || '',
      city: f.city || '',
      province: f.province || '',
      description: f.description || '',
      descriptionAr: f.descriptionAr || '',
      logoUrl: f.logoUrl || '',
      heroImage: f.heroImage || '',
      gallery: (f.gallery ?? []).join(', '),
      rating: String(f.rating ?? 0),
      reviewCount: String(f.reviewCount ?? 0),
      yearsInBusiness: String(f.yearsInBusiness ?? 0),
      capacity: f.capacity || '',
      moq: f.moq || '',
      moqValue: String(f.moqValue ?? 0),
      employees: String(f.employees ?? 0),
      factorySize: f.factorySize || '',
      isVerified: !!f.isVerified,
      isComplianceCertified: !!f.isComplianceCertified,
      isLeadTimeCertified: !!f.isLeadTimeCertified,
      exportMarkets: (f.exportMarkets ?? []).join(', '),
      primaryProducts: (f.primaryProducts ?? []).join(', '),
      website: f.website || '',
      whatsapp: f.whatsapp || '',
      email: f.email || '',
      featured: !!f.featured,
      categoryIds: f.categoryIds ?? [],
      certificateIds: f.certificateIds ?? [],
    });
    setShowForm(true);
  };

  const parseArray = (str: string) =>
    str
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const handleSubmit = () => {
    if (!form.name || !form.slug || !form.location || !form.city || !form.province || !form.description) return;
    const payload = {
      ...form,
      rating: Number(form.rating),
      reviewCount: Number(form.reviewCount),
      yearsInBusiness: Number(form.yearsInBusiness),
      moqValue: Number(form.moqValue),
      employees: Number(form.employees),
      gallery: parseArray(form.gallery),
      exportMarkets: parseArray(form.exportMarkets),
      primaryProducts: parseArray(form.primaryProducts),
    };
    if (editing) {
      update.mutate({ id: editing.id, ...payload });
    } else {
      create.mutate(payload);
    }
  };

  const toggleSelectAll = () => {
    const ids = factoriesData?.items.map((f) => f.id) ?? [];
    setSelected(selected.length === ids.length ? [] : ids);
  };

  const toggleSelect = (id: number) => {
    setSelected(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  const handleBulk = (action: Parameters<typeof bulk.mutate>[0]['action']) => {
    if (selected.length === 0) return;
    if (action === 'delete' && !confirm(`Delete ${selected.length} factories?`)) return;
    bulk.mutate({ ids: selected, action });
  };

  const [productForm, setProductForm] = useState<(Partial<ProductItem> & { name: string }) | null>(null);

  const saveProduct = () => {
    if (!productForm || !productForm.name.trim() || !editing) return;
    if (productForm.id) {
      productUpdate.mutate({
        id: productForm.id,
        name: productForm.name,
        nameAr: productForm.nameAr ?? undefined,
        description: productForm.description ?? undefined,
        imageUrl: productForm.imageUrl ?? undefined,
        priceRange: productForm.priceRange ?? undefined,
        moq: productForm.moq ?? undefined,
      });
    } else {
      productCreate.mutate({
        factoryId: editing.id,
        name: productForm.name,
        nameAr: productForm.nameAr ?? undefined,
        description: productForm.description ?? undefined,
        imageUrl: productForm.imageUrl ?? undefined,
        priceRange: productForm.priceRange ?? undefined,
        moq: productForm.moq ?? undefined,
      });
    }
    setProductForm(null);
  };

  const totalPages = Math.max(1, Math.ceil((factoriesData?.total ?? 0) / PAGE_SIZE));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Factories</h2>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Manage your factory database</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: '#E53935' }}>
          <Plus className="w-4 h-4" /> Add Factory
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-4 mb-6" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search factories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 rounded-xl pl-10 pr-4 text-sm text-white outline-none"
              style={{ background: '#1A2744', border: '1px solid #243352' }}
            />
          </div>
          <Select label="Category" value={categoryId} onChange={(v) => { setCategoryId(v); setPage(1); }} options={[{ value: 'all', label: 'All Categories' }, ...categoryOptions.map((c) => ({ value: String(c.id), label: c.label }))]} />
          <Select label="City" value={city} onChange={(v) => { setCity(v); setPage(1); }} options={[{ value: '', label: 'All Cities' }, ...cityOptions.map((c) => ({ value: c, label: c }))]} />
          <Select label="Verified" value={isVerified} onChange={(v) => { setIsVerified(v as VerifiedFilter); setPage(1); }} options={VERIFIED_OPTIONS} />
          <Select label="Featured" value={featured} onChange={(v) => { setFeatured(v as FeaturedFilter); setPage(1); }} options={FEATURED_OPTIONS} />
          <Select label="Sort" value={sort} onChange={(v) => setSort(v as typeof SORTS[number]['value'])} options={[...SORTS]} />
        </div>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl" style={{ background: '#1A2744', border: '1px solid #243352' }}>
          <span className="text-sm text-white">{selected.length} selected</span>
          <button onClick={() => handleBulk('verify')} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#66BB6A' }}>Verify</button>
          <button onClick={() => handleBulk('unverify')} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#6B7280' }}>Unverify</button>
          <button onClick={() => handleBulk('feature')} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#F9A825' }}>Feature</button>
          <button onClick={() => handleBulk('unfeature')} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#6B7280' }}>Unfeature</button>
          <button onClick={() => handleBulk('delete')} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#E53935' }}>Delete</button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl p-6 mb-6" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">{editing ? 'Edit Factory' : 'Add New Factory'}</h3>
            <button onClick={() => { setShowForm(false); setEditing(null); setProductForm(null); }} className="p-1 rounded-lg" style={{ background: '#1A2744' }}><X className="w-4 h-4" style={{ color: '#94A3B8' }} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <Input label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} required />
            <Input label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} required />
            <Input label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
            <Input label="Province" value={form.province} onChange={(v) => setForm({ ...form, province: v })} required />
            <Input label="Website" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
            <Input label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} />
            <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Input label="Capacity" value={form.capacity} onChange={(v) => setForm({ ...form, capacity: v })} />
            <Input label="MOQ" value={form.moq} onChange={(v) => setForm({ ...form, moq: v })} />
            <Input label="MOQ Value" type="number" value={form.moqValue} onChange={(v) => setForm({ ...form, moqValue: v })} />
            <Input label="Factory Size" value={form.factorySize} onChange={(v) => setForm({ ...form, factorySize: v })} />
            <Input label="Rating" type="number" value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
            <Input label="Review Count" type="number" value={form.reviewCount} onChange={(v) => setForm({ ...form, reviewCount: v })} />
            <Input label="Years in Business" type="number" value={form.yearsInBusiness} onChange={(v) => setForm({ ...form, yearsInBusiness: v })} />
            <Input label="Employees" type="number" value={form.employees} onChange={(v) => setForm({ ...form, employees: v })} />
            <Input label="Logo URL" value={form.logoUrl} onChange={(v) => setForm({ ...form, logoUrl: v })} />
            <Input label="Hero Image URL" value={form.heroImage} onChange={(v) => setForm({ ...form, heroImage: v })} />
            <MultiSelect label="Categories" options={categoryOptions} value={form.categoryIds} onChange={(ids) => setForm({ ...form, categoryIds: ids })} />
            <MultiSelect label="Certificates" options={certificateOptions} value={form.certificateIds} onChange={(ids) => setForm({ ...form, certificateIds: ids })} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <TextArea label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} required />
            <TextArea label="Description (AR)" value={form.descriptionAr} onChange={(v) => setForm({ ...form, descriptionAr: v })} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <TextArea label="Gallery URLs (comma separated)" value={form.gallery} onChange={(v) => setForm({ ...form, gallery: v })} />
            <TextArea label="Export Markets (comma separated)" value={form.exportMarkets} onChange={(v) => setForm({ ...form, exportMarkets: v })} />
            <TextArea label="Primary Products (comma separated)" value={form.primaryProducts} onChange={(v) => setForm({ ...form, primaryProducts: v })} />
          </div>

          <div className="flex flex-wrap gap-6 mt-4">
            <Toggle label="Verified" checked={form.isVerified} onChange={(v) => setForm({ ...form, isVerified: v })} />
            <Toggle label="Featured" checked={form.featured} onChange={(v) => setForm({ ...form, featured: v })} />
            <Toggle label="Compliance Certified" checked={form.isComplianceCertified} onChange={(v) => setForm({ ...form, isComplianceCertified: v })} />
            <Toggle label="Lead Time Certified" checked={form.isLeadTimeCertified} onChange={(v) => setForm({ ...form, isLeadTimeCertified: v })} />
          </div>

          {/* Products section */}
          {editing && (
            <div className="mt-6 pt-6" style={{ borderTop: '1px solid #1A2744' }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2"><Package className="w-4 h-4" style={{ color: '#F9A825' }} /> Products ({editingProducts?.length ?? 0})</h4>
                <button
                  onClick={() => setProductForm({ name: '', nameAr: '', description: '', imageUrl: '', priceRange: '', moq: '' })}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{ background: '#E53935' }}
                >
                  <Plus className="w-3 h-3" /> Add Product
                </button>
              </div>

              {productForm && (
                <div className="rounded-xl p-4 mb-3" style={{ background: '#1A2744', border: '1px solid #243352' }}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <Input label="Product Name" value={productForm.name} onChange={(v) => setProductForm({ ...productForm, name: v })} />
                    <Input label="Name (AR)" value={productForm.nameAr ?? ''} onChange={(v) => setProductForm({ ...productForm, nameAr: v })} />
                    <Input label="Image URL" value={productForm.imageUrl ?? ''} onChange={(v) => setProductForm({ ...productForm, imageUrl: v })} />
                    <Input label="Price Range" value={productForm.priceRange ?? ''} onChange={(v) => setProductForm({ ...productForm, priceRange: v })} />
                    <Input label="MOQ" value={productForm.moq ?? ''} onChange={(v) => setProductForm({ ...productForm, moq: v })} />
                  </div>
                  <TextArea label="Description" value={productForm.description ?? ''} onChange={(v) => setProductForm({ ...productForm, description: v })} />
                  <div className="flex gap-2 mt-3">
                    <button onClick={saveProduct} className="px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: '#66BB6A' }}>Save Product</button>
                    <button onClick={() => setProductForm(null)} className="px-4 py-2 rounded-xl text-xs font-medium" style={{ background: '#243352', color: '#94A3B8' }}>Cancel</button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {(editingProducts ?? []).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: '#1A2744' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#0F1D32' }}><Package className="w-4 h-4" style={{ color: '#F9A825' }} /></div>
                      <div>
                        <p className="text-sm text-white">{p.name}</p>
                        <p className="text-[10px]" style={{ color: '#94A3B8' }}>{p.priceRange || 'No price'} · {p.moq || 'No MOQ'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setProductForm({ id: p.id, name: p.name, nameAr: p.nameAr || '', description: p.description || '', imageUrl: p.imageUrl || '', priceRange: p.priceRange || '', moq: p.moq || '' })} className="p-1.5 rounded-lg" style={{ background: '#243352' }}><Pencil className="w-3.5 h-3.5" style={{ color: '#42A5F5' }} /></button>
                      <button onClick={() => { if (confirm('Delete product?')) productDelete.mutate({ id: p.id }); }} className="p-1.5 rounded-lg" style={{ background: '#243352' }}><Trash2 className="w-3.5 h-3.5" style={{ color: '#E53935' }} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-6">
            <button onClick={handleSubmit} disabled={create.isPending || update.isPending} className="px-6 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#E53935' }}>
              {editing ? 'Update Factory' : 'Create Factory'}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); setProductForm(null); }} className="px-6 py-2 rounded-xl text-sm font-medium" style={{ background: '#1A2744', color: '#94A3B8' }}>Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl p-6" style={{ background: '#0F1D32' }}>
          <div className="h-64 animate-shimmer rounded-xl" style={{ background: '#1A2744' }} />
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #1A2744' }}>
                <th className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3" style={{ color: '#94A3B8' }}>
                  <input
                    type="checkbox"
                    checked={factoriesData?.items.length ? selected.length === factoriesData.items.length : false}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded"
                  />
                </th>
                {['Name', 'Location', 'Rating', 'Products', 'Verified', 'Featured', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3" style={{ color: '#94A3B8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {factoriesData?.items.map((f) => (
                <tr key={f.id} className="transition-colors hover:bg-white/5" style={{ borderBottom: '1px solid #1A2744' }}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.includes(f.id)} onChange={() => toggleSelect(f.id)} className="w-4 h-4 rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Factory className="w-4 h-4" style={{ color: '#F9A825' }} />
                      <span className="text-sm font-medium text-white">{f.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#94A3B8' }}>{f.city}, {f.province}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3" style={{ color: '#F9A825' }} />
                      <span className="text-sm text-white">{f.rating}</span>
                      <span className="text-xs" style={{ color: '#6B7280' }}>({f.reviewCount})</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#94A3B8' }}>{f.productCount}</td>
                  <td className="px-4 py-3">
                    {f.isVerified ? <CheckCircle className="w-4 h-4" style={{ color: '#66BB6A' }} /> : <XCircle className="w-4 h-4" style={{ color: '#E53935' }} />}
                  </td>
                  <td className="px-4 py-3">
                    {f.featured ? <CheckCircle className="w-4 h-4" style={{ color: '#66BB6A' }} /> : <XCircle className="w-4 h-4" style={{ color: '#6B7280' }} />}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button title={f.isVerified ? 'Unverify' : 'Verify'} onClick={() => update.mutate({ id: f.id, isVerified: !f.isVerified })}
                        className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: f.isVerified ? 'rgba(102,187,106,0.15)' : '#1A2744' }}>
                        <Shield className="w-3.5 h-3.5" style={{ color: f.isVerified ? '#66BB6A' : '#6B7280' }} />
                      </button>
                      <button title={f.featured ? 'Unfeature' : 'Feature'} onClick={() => update.mutate({ id: f.id, featured: !f.featured })}
                        className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: f.featured ? 'rgba(249,168,37,0.15)' : '#1A2744' }}>
                        <Star className="w-3.5 h-3.5" style={{ color: f.featured ? '#F9A825' : '#6B7280' }} />
                      </button>
                      <button onClick={() => openEdit(f)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1A2744' }}>
                        <Pencil className="w-3.5 h-3.5" style={{ color: '#42A5F5' }} />
                      </button>
                      <button onClick={() => { if (confirm('Delete this factory?')) del.mutate({ id: f.id }); }} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1A2744' }}>
                        <Trash2 className="w-3.5 h-3.5" style={{ color: '#E53935' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid #1A2744' }}>
            <p className="text-xs" style={{ color: '#94A3B8' }}>Showing {factoriesData?.items.length ?? 0} of {factoriesData?.total ?? 0} factories</p>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40" style={{ background: '#1A2744' }}>
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <span className="text-sm text-white">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40" style={{ background: '#1A2744' }}>
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {factoriesData?.items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: '#94A3B8' }}>No factories found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
