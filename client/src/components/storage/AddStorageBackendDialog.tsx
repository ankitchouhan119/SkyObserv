"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { STORAGE_KINDS } from "@shared/storageEndpoint";
import { toast } from "@/hooks/use-toast";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
  serviceNames?: string[];
  defaultKind?: string;
};

export function AddStorageBackendDialog({
  open,
  onOpenChange,
  onAdded,
  serviceNames = [],
  defaultKind = "PostgreSQL",
}: Props) {
  const [kind, setKind] = useState(defaultKind);
  const [endpoint, setEndpoint] = useState("");
  const [serviceName, setServiceName] = useState(serviceNames[0] ?? "");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    try {
      const res = await fetch("/api/storage-backends", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, endpoint, serviceName: serviceName || undefined, label: label || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not add storage backend");

      setEndpoint("");
      setLabel("");
      onOpenChange(false);
      onAdded();
      toast({ title: "Storage backend added", description: data.backend?.name });
    } catch (err) {
      toast({
        title: "Could not add storage",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add storage backend</DialogTitle>
          <DialogDescription>
            Link a database or cache that is not auto-detected (for example PostgreSQL via Prisma).
            Paste your <code>DATABASE_URL</code> host or full connection string.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storage-kind">Type</Label>
            <select
              id="storage-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm"
            >
              {STORAGE_KINDS.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storage-endpoint">Endpoint or connection URL</Label>
            <Input
              id="storage-endpoint"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="postgresql://user:pass@host:5432/dbname"
              className="font-mono text-xs"
            />
          </div>

          {serviceNames.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="storage-service">Linked service (optional)</Label>
              <select
                id="storage-service"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm"
              >
                <option value="">None</option>
                {serviceNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="storage-label">Display label (optional)</Label>
            <Input
              id="storage-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="TravoBuds Postgres"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !endpoint.trim()}>
            {saving ? "Saving..." : "Add storage"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
