import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, UserPlus, Users, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient } from "@/services/apiClient";
import { useAuthStore } from "@/store/authStore";
import type { PaginatedResponse, UserRole } from "@/types";
import { labelify } from "@/utils/format";
import { Button, Input, Select, Badge, PageLoader, EmptyState, Modal, Tabs } from "@/components/ui";
import { format } from "date-fns";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface UserRecord {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  invited_by_name: string;
  is_accepted: boolean;
  expires_at: string;
  created_at: string;
}

// ─── Invite form schema ────────────────────────────────────────────────────────
const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["SUPER_ADMIN", "NAMRENT_ADMIN", "NAMRENT_OPS", "CLIENT_ADMIN", "CLIENT_USER", "DEALER_ADMIN"]),
  client_id: z.string().optional(),
  dealer_id: z.string().optional(),
});
type InviteForm = z.infer<typeof inviteSchema>;

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "NAMRENT_ADMIN",  label: "NamRent Admin" },
  { value: "NAMRENT_OPS",    label: "NamRent Operations" },
  { value: "CLIENT_ADMIN",   label: "Client Admin" },
  { value: "CLIENT_USER",    label: "Client User" },
  { value: "DEALER_ADMIN",   label: "Dealer Admin" },
];

const SUPER_ROLES: { value: UserRole; label: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  ...ROLE_OPTIONS,
];

// ─── Role badge ────────────────────────────────────────────────────────────────
function roleVariant(role: UserRole) {
  if (["SUPER_ADMIN", "NAMRENT_ADMIN"].includes(role)) return "danger" as const;
  if (role === "NAMRENT_OPS") return "warning" as const;
  if (["CLIENT_ADMIN", "CLIENT_USER"].includes(role)) return "info" as const;
  return "purple" as const;
}

const TABS = [
  { id: "users", label: "Users" },
  { id: "invitations", label: "Invitations" },
];

export default function UsersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const [tab, setTab] = useState("users");
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Users list
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users", search],
    queryFn: () =>
      apiClient.get<PaginatedResponse<UserRecord>>("/accounts/users/", { params: { search, page_size: 50 } }).then(r => r.data),
    enabled: tab === "users",
  });

  // Invitations list
  const { data: invitesData, isLoading: invitesLoading } = useQuery({
    queryKey: ["invitations", search],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Invitation>>("/accounts/invitations/", { params: { search, page_size: 50 } }).then(r => r.data),
    enabled: tab === "invitations",
  });

  // Send invite
  const inviteMutation = useMutation({
    mutationFn: (data: InviteForm) => apiClient.post("/accounts/invitations/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      setInviteOpen(false);
      setInviteError(null);
      reset();
    },
    onError: () => {
      setInviteError("Failed to send invitation. The email may already be in use.");
    },
  });

  // Resend invite
  const resendMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/accounts/invitations/${id}/resend/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invitations"] }),
  });

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "CLIENT_ADMIN" },
  });

  const watchedRole = watch("role");
  const needsClient = ["CLIENT_ADMIN", "CLIENT_USER"].includes(watchedRole);
  const needsDealer = watchedRole === "DEALER_ADMIN";

  const roleOptions = isSuperAdmin ? SUPER_ROLES : ROLE_OPTIONS;

  const tabs = TABS.map((t) => ({
    ...t,
    count: t.id === "users" ? usersData?.count : invitesData?.count,
  }));

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users &amp; Roles</h1>
          <p className="page-subtitle">Manage team members and invitations</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus size={16} /> Invite user
        </Button>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={(id) => { setTab(id); setSearch(""); }} className="mb-6" />

      <div className="mb-4">
        <Input
          placeholder={tab === "users" ? "Search users…" : "Search invitations…"}
          leftIcon={<Search size={16} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Users tab */}
      {tab === "users" && (
        usersLoading ? <PageLoader /> :
        !usersData?.results.length ? (
          <EmptyState icon={Users} title="No users found" />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {usersData.results.map((u) => (
                  <tr key={u.id}>
                    <td className="font-medium">{u.full_name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || <span className="text-[var(--color-text-muted)]">—</span>}</td>
                    <td><Badge variant={roleVariant(u.role)}>{labelify(u.role)}</Badge></td>
                    <td>
                      <Badge variant={u.is_active ? "success" : "default"}>
                        {u.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td>{format(new Date(u.created_at), "d MMM yyyy")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Invitations tab */}
      {tab === "invitations" && (
        invitesLoading ? <PageLoader /> :
        !invitesData?.results.length ? (
          <EmptyState
            icon={Mail}
            title="No invitations"
            description="Invite team members or clients to join NamRent."
            action={<Button onClick={() => setInviteOpen(true)}><Plus size={16} /> Send invitation</Button>}
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Invited by</th>
                  <th>Status</th>
                  <th>Expires</th>
                  <th>Sent</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invitesData.results.map((inv) => {
                  const expired = new Date(inv.expires_at) < new Date();
                  return (
                    <tr key={inv.id}>
                      <td className="font-medium">{inv.email}</td>
                      <td><Badge variant={roleVariant(inv.role)}>{labelify(inv.role)}</Badge></td>
                      <td>{inv.invited_by_name}</td>
                      <td>
                        <Badge variant={inv.is_accepted ? "success" : expired ? "danger" : "warning"}>
                          {inv.is_accepted ? "Accepted" : expired ? "Expired" : "Pending"}
                        </Badge>
                      </td>
                      <td className={expired && !inv.is_accepted ? "text-[var(--color-danger)]" : ""}>
                        {format(new Date(inv.expires_at), "d MMM yyyy")}
                      </td>
                      <td>{format(new Date(inv.created_at), "d MMM yyyy")}</td>
                      <td>
                        {!inv.is_accepted && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resendMutation.mutate(inv.id)}
                            loading={resendMutation.isPending}
                          >
                            Resend
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Invite modal */}
      <Modal open={inviteOpen} onClose={() => { setInviteOpen(false); setInviteError(null); reset(); }} title="Invite user" size="sm">
        <form onSubmit={handleSubmit((d) => inviteMutation.mutate(d))} noValidate className="space-y-4">
          <Input
            label="Email address"
            type="email"
            autoComplete="off"
            error={errors.email?.message}
            {...register("email")}
          />
          <Select
            label="Role"
            options={roleOptions}
            error={errors.role?.message}
            {...register("role")}
          />
          {needsClient && (
            <Input
              label="Client ID"
              placeholder="Paste the client UUID"
              hint="Required for CLIENT_ADMIN and CLIENT_USER roles"
              error={errors.client_id?.message}
              {...register("client_id")}
            />
          )}
          {needsDealer && (
            <Input
              label="Dealer ID"
              placeholder="Paste the dealer UUID"
              hint="Required for DEALER_ADMIN role"
              error={errors.dealer_id?.message}
              {...register("dealer_id")}
            />
          )}
          {inviteError && (
            <p className="rounded-lg bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">{inviteError}</p>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => { setInviteOpen(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={inviteMutation.isPending}><Mail size={14} /> Send invite</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
