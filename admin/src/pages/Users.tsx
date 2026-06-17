import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { User, Role } from "../types";
import {
  PageHeader,
  Modal,
  EmptyState,
  Spinner,
  Badge,
  Pagination,
  Table,
  Th,
  Td,
  Tr,
  Btn,
  Field,
  selectCls,
  ConfirmDialog,
} from "../components/ui";
import {
  Users,
  Search,
  ShieldCheck,
  ShieldX,
  UserCog,
  Crown,
  Mail,
  Phone,
  Link2,
  KeyRound,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";

const ROLES: Role[] = ["customer", "manager", "admin", "owner"];

const ROLE_META: Record<Role, { label: string; description: string; color: string; icon: React.ReactNode }> = {
  customer: {
    label: "Customer",
    description: "Standard customer account. No admin access.",
    color: "bg-stone-100 border-stone-200 text-stone-600",
    icon: <Users size={14} />,
  },
  manager: {
    label: "Manager",
    description: "Can manage products, categories, and view orders.",
    color: "bg-stone-700 text-white border-stone-700",
    icon: <ShieldCheck size={14} />,
  },
  admin: {
    label: "Admin",
    description: "Full admin access except user role management.",
    color: "bg-brand-600 text-white border-brand-700",
    icon: <ShieldX size={14} />,
  },
  owner: {
    label: "Owner",
    description: "Full access including role management. Highest privilege.",
    color: "bg-stone-900 text-white border-stone-900",
    icon: <Crown size={14} />,
  },
};

function RoleChangeModal({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>(user.role);
  const [confirming, setConfirming] = useState(false);

  const mutation = useMutation({
    mutationFn: (role: Role) => api.patch(`/users/${user.id}/role`, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(`${user.name}'s role updated to ${selectedRole}`);
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message ?? "Failed to update role"),
  });

  const isSelf = currentUser?.id === user.id;

  return (
    <Modal title={`Manage Role — ${user.name}`} onClose={onClose} size="md">
      <div className="space-y-5">
        {/* User info */}
        <div className="flex items-start gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
          <div className="w-12 h-12 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center shrink-0 text-lg font-bold text-brand-700">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              user.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-stone-900 text-sm">{user.name}</div>
            <div className="flex items-center gap-1 text-xs text-stone-500 mt-0.5">
              <Mail size={10} /> {user.email}
            </div>
            {user.phone && (
              <div className="flex items-center gap-1 text-xs text-stone-400 mt-0.5">
                <Phone size={10} /> {user.phone}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge value={user.role} />
              {user.hasPassword && (
                <span className="flex items-center gap-1 text-[10px] text-stone-400">
                  <KeyRound size={9} /> Password set
                </span>
              )}
              {user.linkedProviders?.map((p) => (
                <span key={p} className="flex items-center gap-1 text-[10px] text-stone-400">
                  <Link2 size={9} /> {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {isSelf && (
          <div className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl">
            You cannot change your own role.
          </div>
        )}

        {/* Role options */}
        <div>
          <Field label="Assign Role">
            <div className="space-y-2 mt-1">
              {ROLES.map((role) => {
                const meta = ROLE_META[role];
                const isSelected = selectedRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => !isSelf && setSelectedRole(role)}
                    disabled={isSelf}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                      isSelected
                        ? "border-brand-500 bg-brand-50"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}
                    >
                      {meta.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                        {meta.label}
                        {user.role === role && (
                          <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded font-medium">
                            current
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5">{meta.description}</div>
                    </div>
                    {isSelected && (
                      <ShieldCheck size={16} className="text-brand-500 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn
            onClick={() => setConfirming(true)}
            disabled={selectedRole === user.role || isSelf}
            loading={mutation.isPending}
          >
            <UserCog size={14} /> Apply Role
          </Btn>
        </div>
      </div>

      {confirming && (
        <ConfirmDialog
          message={`Change ${user.name}'s role from "${user.role}" to "${selectedRole}"?`}
          onConfirm={() => {
            setConfirming(false);
            mutation.mutate(selectedRole);
          }}
          onCancel={() => setConfirming(false)}
          loading={mutation.isPending}
          confirmLabel="Confirm Change"
          danger={false}
        />
      )}
    </Modal>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [managingUser, setManagingUser] = useState<User | null>(null);

  const isOwner = currentUser?.role === "owner";

  const { data, isLoading } = useQuery({
    queryKey: ["users", page, search, roleFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      return api.get(`/users?${params}`).then((r) => r.data);
    },
    enabled: isOwner,
  });

  const users: User[] = data?.data ?? [];
  const meta = data?.meta;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const clearSearch = () => {
    setSearch("");
    setSearchInput("");
    setPage(1);
  };

  if (!isOwner) {
    return (
      <div>
        <PageHeader title="Users & Roles" />
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-start gap-4">
          <ShieldX size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Owner access required</p>
            <p className="text-xs text-amber-700 mt-1">
              Only users with the <strong>Owner</strong> role can view and manage user accounts
              and role assignments. Contact your owner to get access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Users & Roles"
        subtitle={meta ? `${meta.total} registered user${meta.total !== 1 ? "s" : ""}` : ""}
      />

      {/* Role legend */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {ROLES.map((role) => {
          const meta = ROLE_META[role];
          const count = users.filter((u) => u.role === role).length;
          return (
            <button
              key={role}
              onClick={() => {
                setRoleFilter(roleFilter === role ? "" : role);
                setPage(1);
              }}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                roleFilter === role
                  ? "border-brand-400 bg-brand-50 shadow-sm"
                  : "border-stone-200 bg-white hover:border-stone-300"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${meta.color}`}>
                {meta.icon}
              </div>
              <div>
                <div className="text-xs font-bold text-stone-700">{meta.label}</div>
                {data && (
                  <div className="text-[10px] text-stone-400">{count} on this page</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Search & filters */}
      <div className="flex gap-3 mb-5">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              className="w-full border border-stone-300 rounded-lg pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 bg-white"
              placeholder="Search by name, email, phone…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <Btn type="submit" variant="secondary" size="sm">Search</Btn>
        </form>

        {roleFilter && (
          <Btn variant="ghost" size="sm" onClick={() => { setRoleFilter(""); setPage(1); }}>
            <X size={12} /> Clear filter
          </Btn>
        )}
      </div>

      {isLoading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <EmptyState
          message={search || roleFilter ? "No users match your filters." : "No users found."}
          icon={<Users size={32} />}
        />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Contact</Th>
                <Th>Role</Th>
                <Th>Auth</Th>
                <Th>Joined</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <Tr key={u.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center shrink-0 text-xs font-bold text-brand-700">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          u.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-stone-800 text-sm flex items-center gap-2">
                          {u.name}
                          {u.id === currentUser?.id && (
                            <span className="text-[10px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded font-medium">
                              you
                            </span>
                          )}
                        </div>
                        {u.newsletterOptIn && (
                          <div className="text-[10px] text-stone-400 flex items-center gap-0.5">
                            <Mail size={9} /> newsletter
                          </div>
                        )}
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-xs text-stone-600">
                        <Mail size={10} className="text-stone-400" /> {u.email}
                      </div>
                      {u.phone && (
                        <div className="flex items-center gap-1 text-xs text-stone-400">
                          <Phone size={10} /> {u.phone}
                        </div>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <Badge value={u.role} />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {u.hasPassword && (
                        <span className="flex items-center gap-1 text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded border border-stone-200">
                          <KeyRound size={9} /> Password
                        </span>
                      )}
                      {u.linkedProviders?.map((p) => (
                        <span
                          key={p}
                          className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-200 capitalize"
                        >
                          <Link2 size={9} /> {p}
                        </span>
                      ))}
                    </div>
                  </Td>
                  <Td>
                    <span className="text-xs text-stone-400">
                      {new Date(u.createdAt).toLocaleDateString("en-PK", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </Td>
                  <Td>
                    <Btn
                      variant="secondary"
                      size="sm"
                      onClick={() => setManagingUser(u)}
                      disabled={u.id === currentUser?.id}
                    >
                      <UserCog size={12} /> Manage
                    </Btn>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          {meta && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              onPage={setPage}
            />
          )}
        </>
      )}

      {managingUser && (
        <RoleChangeModal user={managingUser} onClose={() => setManagingUser(null)} />
      )}
    </div>
  );
}
