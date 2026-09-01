"use client";

import { useEffect, useState } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  Globe,
  HardDrive,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Server,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { AddStorageBackendDialog } from "@/components/storage/AddStorageBackendDialog";

type RegisteredService = {
  serviceName: string;
  serviceInstance?: string | null;
  lastSeenAt?: string | null;
};

type TeamMember = {
  id: number;
  email: string;
  fullName: string;
  contactNumber?: string | null;
  createdAt?: string | null;
};

type ConfiguredStorage = {
  id: string;
  name: string;
  kind: string;
  endpoint: string;
  serviceName?: string | null;
};

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [services, setServices] = useState<RegisteredService[]>([]);
  const [storageBackends, setStorageBackends] = useState<ConfiguredStorage[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [registerUrl, setRegisterUrl] = useState("");
  const [envSnippet, setEnvSnippet] = useState("");
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [storageOpen, setStorageOpen] = useState(false);
  const [tempPasswordOpen, setTempPasswordOpen] = useState(false);

  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const [tempPassword, setTempPassword] = useState("");
  const [tempPasswordLabel, setTempPasswordLabel] = useState("");

  const isOwner = user?.canManageTeam !== false;

  function loadData() {
    setLoading(true);
    const requests: Promise<void>[] = [
      fetch("/api/profile/services", { credentials: "include" })
        .then((res) => res.json())
        .then((data) => setServices(data.services ?? [])),
    ];

    if (isOwner) {
      requests.push(
        fetch("/api/storage-backends", { credentials: "include" })
          .then((res) => (res.ok ? res.json() : { backends: [] }))
          .then((data) => setStorageBackends(data.backends ?? [])),
        fetch("/api/profile/setup", { credentials: "include" })
          .then((res) => (res.ok ? res.json() : { registerUrl: "", envSnippet: "" }))
          .then((setup) => {
            setRegisterUrl(setup.registerUrl ?? "");
            setEnvSnippet(setup.envSnippet ?? "");
          }),
        fetch("/api/profile/team", { credentials: "include" })
          .then((res) => (res.ok ? res.json() : { members: [] }))
          .then((data) => setTeamMembers(data.members ?? [])),
      );
    }

    Promise.all(requests).finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [user?.apiToken, isOwner]);

  function openProfileDialog() {
    setFullName(user?.fullName ?? "");
    setContactNumber(user?.contactNumber ?? "");
    setOrganisation(user?.organisation ?? "");
    setCurrentPassword("");
    setNewPassword("");
    setProfileOpen(true);
  }

  function showTempPassword(password: string, label: string) {
    setTempPassword(password);
    setTempPasswordLabel(label);
    setTempPasswordOpen(true);
  }

  async function copyToken() {
    if (!user?.apiToken) return;
    await navigator.clipboard.writeText(user.apiToken);
    toast({ title: "Token copied" });
  }

  async function copyRegisterUrl() {
    if (!registerUrl) return;
    await navigator.clipboard.writeText(registerUrl);
    toast({ title: "Register URL copied" });
  }

  async function copyEnvSnippet() {
    if (!envSnippet) return;
    await navigator.clipboard.writeText(envSnippet);
    toast({ title: "Env snippet copied" });
  }

  async function copyTempPassword() {
    await navigator.clipboard.writeText(tempPassword);
    toast({ title: "Temporary password copied" });
  }

  async function regenerateToken() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/profile/regenerate-token", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to regenerate token");
      await refresh();
      toast({
        title: "Token regenerated",
        description: "Update SKYOBSERV_USER_TOKEN in your service .env and restart it.",
      });
    } catch {
      toast({ title: "Could not regenerate token", variant: "destructive" });
    } finally {
      setRegenerating(false);
    }
  }

  async function saveProfile() {
    setSavingProfile(true);
    try {
      const body: Record<string, string> = {
        fullName,
        contactNumber,
        organisation,
      };
      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not update profile");

      await refresh();
      setProfileOpen(false);
      toast({ title: "Profile updated" });
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Could not update profile",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function inviteMember() {
    setInviting(true);
    try {
      const res = await fetch("/api/profile/team/invite", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), fullName: inviteName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not invite member");

      setInviteOpen(false);
      setInviteName("");
      setInviteEmail("");
      loadData();
      showTempPassword(data.tempPassword, `Temporary password for ${data.member.email}`);
    } catch (err) {
      toast({
        title: "Invite failed",
        description: err instanceof Error ? err.message : "Could not invite member",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  }

  async function resetMemberPassword(member: TeamMember) {
    try {
      const res = await fetch(`/api/profile/team/${member.id}/reset-password`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not reset password");

      showTempPassword(data.tempPassword, `New temporary password for ${member.email}`);
    } catch (err) {
      toast({
        title: "Reset failed",
        description: err instanceof Error ? err.message : "Could not reset password",
        variant: "destructive",
      });
    }
  }

  async function removeMember(member: TeamMember) {
    try {
      const res = await fetch(`/api/profile/team/${member.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not remove member");

      loadData();
      toast({ title: "Team member removed" });
    } catch (err) {
      toast({
        title: "Remove failed",
        description: err instanceof Error ? err.message : "Could not remove member",
        variant: "destructive",
      });
    }
  }

  async function removeStorageBackend(backend: ConfiguredStorage) {
    const numericId = backend.id.replace(/^cfg:/, "");
    try {
      const res = await fetch(`/api/storage-backends/${numericId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not remove storage backend");

      loadData();
      toast({ title: "Storage backend removed" });
    } catch (err) {
      toast({
        title: "Remove failed",
        description: err instanceof Error ? err.message : "Could not remove storage backend",
        variant: "destructive",
      });
    }
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>Profile</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isOwner
                ? "Manage your account, team access, and service connection details."
                : "Manage your account details. You have shared access to the owner's services."}
            </p>
          </div>
          <Button variant="outline" onClick={openProfileDialog}>
            <Pencil className="w-4 h-4 mr-2" />
            Update profile
          </Button>
        </div>

        {isOwner && (
          <>
            <Card className="p-5 so-card space-y-4">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Globe className="w-4 h-4 text-primary" />
                Register URL
              </div>
              <div className="flex gap-2">
                <Input readOnly value={registerUrl} className="font-mono text-xs" />
                <Button variant="outline" onClick={copyRegisterUrl}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Set as <code>SKYOBSERV_REGISTER_URL</code> in your service.
              </p>
            </Card>

            <Card className="p-5 so-card space-y-4">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <KeyRound className="w-4 h-4 text-primary" />
                User token
              </div>

              <div className="flex gap-2">
                <Input readOnly value={user?.apiToken ?? ""} className="font-mono text-xs" />
                <Button variant="outline" onClick={copyToken}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={regenerateToken} disabled={regenerating}>
                  <RefreshCw className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`} />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                Set as <code>SKYOBSERV_USER_TOKEN</code> in your service. On startup your service
                registers itself and receives the collector address automatically.
              </p>

              <pre className="rounded-lg bg-muted border border-border p-4 text-xs text-primary overflow-x-auto whitespace-pre-wrap font-mono">
                {envSnippet || "Loading..."}
              </pre>

              <Button variant="secondary" onClick={copyEnvSnippet} disabled={!envSnippet}>
                <Copy className="w-4 h-4 mr-2" />
                Copy full .env snippet
              </Button>
            </Card>
          </>
        )}

        {isOwner && (
          <div className="so-card p-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Users className="w-4 h-4 text-primary" />
                Team access
              </div>
              <Button onClick={() => setInviteOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite user
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Invite others to view your linked services. They will receive a temporary password
              that is shown only once.
            </p>

            {teamMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No team members yet.</p>
            ) : (
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border/60 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">{member.fullName}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => resetMemberPassword(member)}>
                        New temp password
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removeMember(member)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isOwner && (
          <div className="so-card p-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <HardDrive className="w-4 h-4 text-primary" />
                Storage backends
              </div>
              <Button onClick={() => setStorageOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add PostgreSQL
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Link databases that are not auto-detected from traces (for example PostgreSQL via Prisma).
              Paste your <code>DATABASE_URL</code> — no changes needed in your app.
            </p>

            {storageBackends.length === 0 ? (
              <p className="text-sm text-muted-foreground">No configured storage backends yet.</p>
            ) : (
              <div className="space-y-2">
                {storageBackends.map((backend) => (
                  <div
                    key={backend.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border/60 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{backend.name}</p>
                      <p className="text-xs text-muted-foreground break-all">{backend.endpoint}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {backend.kind}
                        {backend.serviceName ? ` · linked to ${backend.serviceName}` : ""}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeStorageBackend(backend)}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="so-card p-5 space-y-4">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <Server className="w-4 h-4 text-primary" />
            Linked services
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : services.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isOwner
                ? "No services linked yet. Add the env vars above and restart your service."
                : "No services linked to this account yet."}
            </p>
          ) : (
            <div className="space-y-2">
              {services.map((service) => (
                <div
                  key={service.serviceName}
                  className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{service.serviceName}</p>
                    {service.serviceInstance && (
                      <p className="text-xs text-muted-foreground">{service.serviceInstance}</p>
                    )}
                  </div>
                  {service.lastSeenAt && (
                    <p className="text-xs text-muted-foreground">
                      Last seen {new Date(service.lastSeenAt).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update profile</DialogTitle>
            <DialogDescription>Change your account details or password.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-fullName">Full name</Label>
              <Input
                id="profile-fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-contact">Mobile number</Label>
              <Input
                id="profile-contact"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-org">Organisation (optional)</Label>
              <Input
                id="profile-org"
                value={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
              />
            </div>

            <div className="border-t border-border/60 pt-4 space-y-4">
              <p className="text-sm text-muted-foreground">Leave blank to keep your current password.</p>
              <PasswordField
                id="profile-current-password"
                label="Current password"
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="Required only if changing password"
              />
              <PasswordField
                id="profile-new-password"
                label="New password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="At least 8 characters"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
            <DialogDescription>
              They will be able to view your linked services. A temporary password will be shown
              once after you invite them.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Full name</Label>
              <Input
                id="invite-name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Team member name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="member@company.com"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={inviteMember} disabled={inviting}>
              {inviting ? "Inviting..." : "Invite user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tempPasswordOpen} onOpenChange={setTempPasswordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Temporary password</DialogTitle>
            <DialogDescription>
              {tempPasswordLabel}. Copy it now — you will not be able to see it again. If they
              forget it, generate a new temporary password from the team list.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2">
            <Input readOnly value={tempPassword} className="font-mono text-sm" />
            <Button variant="outline" onClick={copyTempPassword}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          <DialogFooter>
            <Button onClick={() => setTempPasswordOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddStorageBackendDialog
        open={storageOpen}
        onOpenChange={setStorageOpen}
        onAdded={loadData}
        serviceNames={services.map((service) => service.serviceName)}
        defaultKind="PostgreSQL"
      />
    </AppLayout>
  );
}
