import { useEffect, useState } from 'react';
import { trpc } from '@/providers/trpc';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../../api/router';
import { Users, Search, Shield, User, Trash2, Pencil, Plus, ChevronLeft, ChevronRight, X, Factory, ClipboardList, Star, Heart } from 'lucide-react';

type AdminOutputs = inferRouterOutputs<AppRouter>['admin'];
type UserListItem = AdminOutputs['userList']['items'][number];
type RoleFilter = 'all' | 'admin' | 'user';
type LangFilter = 'all' | 'en' | 'ar';

const PAGE_SIZE = 10;

const emptyForm = {
  name: '',
  email: '',
  role: 'user' as 'user' | 'admin',
  lang: 'en' as 'en' | 'ar',
  avatar: '',
  company: '',
  phone: '',
};

function Input({ label, value, onChange, type = 'text', required }: { label?: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
        style={{ background: '#1A2744', border: '1px solid #243352' }}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label?: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none appearance-none"
        style={{ background: '#1A2744', border: '1px solid #243352' }}
      >
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-auto rounded-2xl p-6 m-4" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: '#1A2744' }}><X className="w-4 h-4" style={{ color: '#94A3B8' }} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function UsersPage() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState<RoleFilter>('all');
  const [lang, setLang] = useState<LangFilter>('all');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UserListItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [detailUserId, setDetailUserId] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const { data: usersData, isLoading } = trpc.admin.userList.useQuery({
    search: debouncedSearch || undefined,
    role: role === 'all' ? undefined : role,
    lang: lang === 'all' ? undefined : lang,
    page,
    pageSize: PAGE_SIZE,
  });

  const { data: detail } = trpc.admin.userDetail.useQuery(
    { id: detailUserId! },
    { enabled: !!detailUserId }
  );

  const create = trpc.admin.userCreate.useMutation({
    onSuccess: () => {
      utils.admin.userList.invalidate();
      setShowForm(false);
      setForm(emptyForm);
      setEditing(null);
    },
  });
  const update = trpc.admin.userUpdate.useMutation({
    onSuccess: () => {
      utils.admin.userList.invalidate();
      setShowForm(false);
      setForm(emptyForm);
      setEditing(null);
    },
  });
  const del = trpc.admin.userDelete.useMutation({
    onSuccess: () => utils.admin.userList.invalidate(),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (u: UserListItem) => {
    setEditing(u);
    setForm({
      name: u.name || '',
      email: u.email || '',
      role: u.role || 'user',
      lang: u.lang || 'en',
      avatar: u.avatar || '',
      company: u.company || '',
      phone: u.phone || '',
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name) return;
    if (editing) {
      update.mutate({ id: editing.id, ...form });
    } else {
      create.mutate(form);
    }
  };

  const totalPages = Math.max(1, Math.ceil((usersData?.total ?? 0) / PAGE_SIZE));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Users</h2>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Manage platform users</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: '#E53935' }}>
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="rounded-2xl p-4 mb-6" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 rounded-xl pl-10 pr-4 text-sm text-white outline-none"
              style={{ background: '#1A2744', border: '1px solid #243352' }}
            />
          </div>
          <Select label="Role" value={role} onChange={(v) => { setRole(v as RoleFilter); setPage(1); }} options={[{ value: 'all', label: 'All Roles' }, { value: 'admin', label: 'Admin' }, { value: 'user', label: 'User' }]} />
          <Select label="Language" value={lang} onChange={(v) => { setLang(v as LangFilter); setPage(1); }} options={[{ value: 'all', label: 'All Languages' }, { value: 'en', label: 'English' }, { value: 'ar', label: 'Arabic' }]} />
        </div>
      </div>

      {showForm && (
        <div className="rounded-2xl p-6 mb-6" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
          <h3 className="text-sm font-semibold text-white mb-4">{editing ? 'Edit User' : 'Add New User'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Select label="Role" value={form.role} onChange={(v) => setForm({ ...form, role: v as 'user' | 'admin' })} options={[{ value: 'user', label: 'User' }, { value: 'admin', label: 'Admin' }]} />
            <Select label="Language" value={form.lang} onChange={(v) => setForm({ ...form, lang: v as 'en' | 'ar' })} options={[{ value: 'en', label: 'English' }, { value: 'ar', label: 'Arabic' }]} />
            <Input label="Avatar URL" value={form.avatar} onChange={(v) => setForm({ ...form, avatar: v })} />
            <Input label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
            <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSubmit} disabled={create.isPending || update.isPending} className="px-6 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#E53935' }}>{editing ? 'Update User' : 'Create User'}</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-6 py-2 rounded-xl text-sm font-medium" style={{ background: '#1A2744', color: '#94A3B8' }}>Cancel</button>
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
                {['User', 'Email', 'Role', 'Language', 'Joined', 'Last Sign In', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3" style={{ color: '#94A3B8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usersData?.items.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-white/5" style={{ borderBottom: '1px solid #1A2744' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.avatar ? (
                        <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#E53935' }}>
                          {(u.name || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-white block">{u.name || 'Unknown'}</span>
                        {u.company && <span className="text-[10px]" style={{ color: '#6B7280' }}>{u.company}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#94A3B8' }}>{u.email || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold w-fit" style={{
                      background: u.role === 'admin' ? 'rgba(229,57,53,0.1)' : 'rgba(66,165,245,0.1)',
                      color: u.role === 'admin' ? '#E53935' : '#42A5F5',
                    }}>
                      {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#94A3B8' }}>{u.lang?.toUpperCase()}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#94A3B8' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#94A3B8' }}>{u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button title="View details" onClick={() => setDetailUserId(u.id)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1A2744' }}>
                        <Users className="w-3.5 h-3.5" style={{ color: '#42A5F5' }} />
                      </button>
                      <button title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'} onClick={() => update.mutate({ id: u.id, role: u.role === 'admin' ? 'user' : 'admin' })}
                        className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1A2744' }}>
                        {u.role === 'admin' ? <User className="w-3.5 h-3.5" style={{ color: '#42A5F5' }} /> : <Shield className="w-3.5 h-3.5" style={{ color: '#F9A825' }} />}
                      </button>
                      <button onClick={() => openEdit(u)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1A2744' }}>
                        <Pencil className="w-3.5 h-3.5" style={{ color: '#42A5F5' }} />
                      </button>
                      <button onClick={() => { if (confirm('Delete this user?')) del.mutate({ id: u.id }); }} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1A2744' }}>
                        <Trash2 className="w-3.5 h-3.5" style={{ color: '#E53935' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid #1A2744' }}>
            <p className="text-xs" style={{ color: '#94A3B8' }}>Showing {usersData?.items.length ?? 0} of {usersData?.total ?? 0} users</p>
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

          {usersData?.items.length === 0 && (
            <div className="text-center py-12"><p className="text-sm" style={{ color: '#94A3B8' }}>No users found</p></div>
          )}
        </div>
      )}

      <Modal open={!!detailUserId} onClose={() => setDetailUserId(null)} title="User Details">
        {detail ? (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              {detail.user.avatar ? (
                <img src={detail.user.avatar} alt="" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ background: '#E53935' }}>
                  {(detail.user.name || 'U')[0].toUpperCase()}
                </div>
              )}
              <div>
                <h4 className="text-lg font-semibold text-white">{detail.user.name || 'Unknown'}</h4>
                <p className="text-sm" style={{ color: '#94A3B8' }}>{detail.user.email || 'No email'}</p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: detail.user.role === 'admin' ? 'rgba(229,57,53,0.1)' : 'rgba(66,165,245,0.1)', color: detail.user.role === 'admin' ? '#E53935' : '#42A5F5' }}>{detail.user.role}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(249,168,37,0.1)', color: '#F9A825' }}>{detail.user.lang?.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl p-3" style={{ background: '#1A2744' }}>
                <div className="flex items-center gap-2 mb-1"><ClipboardList className="w-4 h-4" style={{ color: '#42A5F5' }} /><span className="text-xs" style={{ color: '#94A3B8' }}>RFQs</span></div>
                <p className="text-xl font-bold text-white">{detail.rfqs.length}</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: '#1A2744' }}>
                <div className="flex items-center gap-2 mb-1"><Heart className="w-4 h-4" style={{ color: '#E53935' }} /><span className="text-xs" style={{ color: '#94A3B8' }}>Favorites</span></div>
                <p className="text-xl font-bold text-white">{detail.favorites.length}</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: '#1A2744' }}>
                <div className="flex items-center gap-2 mb-1"><Star className="w-4 h-4" style={{ color: '#F9A825' }} /><span className="text-xs" style={{ color: '#94A3B8' }}>Reviews</span></div>
                <p className="text-xl font-bold text-white">{detail.reviews.length}</p>
              </div>
            </div>

            {detail.rfqs.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><ClipboardList className="w-4 h-4" style={{ color: '#42A5F5' }} /> Recent RFQs</h5>
                <div className="flex flex-col gap-2 max-h-40 overflow-auto">
                  {detail.rfqs.slice(0, 5).map((r) => (
                    <div key={r.id} className="rounded-xl px-3 py-2" style={{ background: '#1A2744' }}>
                      <p className="text-sm text-white">{r.productName}</p>
                      <p className="text-[10px]" style={{ color: '#94A3B8' }}>Qty: {r.quantity} · Status: {r.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detail.favorites.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><Factory className="w-4 h-4" style={{ color: '#F9A825' }} /> Favorite Factories</h5>
                <div className="flex flex-wrap gap-2">
                  {detail.favorites.slice(0, 10).map((f) => (
                    <span key={f.id} className="px-2 py-1 rounded-lg text-xs text-white" style={{ background: '#1A2744' }}>{f.factoryName || `Factory #${f.factoryId}`}</span>
                  ))}
                </div>
              </div>
            )}

            {detail.reviews.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><Star className="w-4 h-4" style={{ color: '#F9A825' }} /> Reviews</h5>
                <div className="flex flex-col gap-2 max-h-40 overflow-auto">
                  {detail.reviews.slice(0, 5).map((r) => (
                    <div key={r.id} className="rounded-xl px-3 py-2" style={{ background: '#1A2744' }}>
                      <p className="text-sm text-white">{r.factoryName || 'Factory'}</p>
                      <p className="text-[10px]" style={{ color: '#94A3B8' }}>Rating: {r.rating}/5 · {r.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-40 animate-shimmer rounded-xl" style={{ background: '#1A2744' }} />
        )}
      </Modal>
    </div>
  );
}
