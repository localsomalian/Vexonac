"use client";

import { ContentLayout } from "@/components/content-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-session";
import { Plus, Shield, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function WhitelistPage() {
  const params = useParams();
  const serverId = params.serverId as string;
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [playerLicense, setPlayerLicense] = useState("");
  const [note, setNote] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: session } = useSession();

  const { data, isLoading } = useQuery(
    trpc.servers.getTrustedPlayers.queryOptions(
      { serverId },
      { enabled: !!session },
    ),
  );

  const addMutation = useMutation(
    trpc.servers.addTrustedPlayer.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["servers", "getTrustedPlayers"]] });
        toast.success("Player added to whitelist");
        setAddOpen(false);
        setPlayerLicense("");
        setNote("");
      },
      onError: (err: any) => {
        toast.error(err?.message ?? "Failed to add player");
      },
    }),
  );

  const removeMutation = useMutation(
    trpc.servers.removeTrustedPlayer.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["servers", "getTrustedPlayers"]] });
        toast.success("Player removed from whitelist");
        setDeleteId(null);
      },
      onError: (err: any) => {
        toast.error(err?.message ?? "Failed to remove player");
      },
    }),
  );

  const handleAdd = () => {
    const trimmed = playerLicense.trim();
    if (!trimmed) return;
    addMutation.mutate({ serverId, playerLicense: trimmed, note: note.trim() || undefined });
  };

  return (
    <ContentLayout title="Whitelist">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Trusted Players
              </CardTitle>
              <CardDescription>
                Players on this list bypass anti-cheat detections. Add their
                primary license identifier (e.g. <code>license:abc123...</code>).
              </CardDescription>
            </div>
            <Button onClick={() => setAddOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Player
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !data || data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-2">
                <Shield className="h-10 w-10 opacity-30" />
                <p className="text-sm">No trusted players yet.</p>
                <p className="text-xs">
                  Add a player's license to whitelist them from detections.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>License</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Added By</TableHead>
                    <TableHead>Added At</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-xs max-w-[280px] truncate">
                        {entry.playerLicense}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.note ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {entry.addedByName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(entry.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Trusted Player</DialogTitle>
            <DialogDescription>
              Enter the player's license identifier. They will bypass all
              anti-cheat detections on this server.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="license">Player License *</Label>
              <Input
                id="license"
                placeholder="license:abc123def456..."
                value={playerLicense}
                onChange={(e) => setPlayerLicense(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Copy from the player's profile in the Players tab.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note">Note (optional)</Label>
              <Input
                id="note"
                placeholder="e.g. Server owner, trusted staff..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!playerLicense.trim() || addMutation.isPending}
            >
              {addMutation.isPending ? "Adding..." : "Add to Whitelist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove confirm dialog */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from Whitelist</DialogTitle>
            <DialogDescription>
              This player will no longer bypass anti-cheat detections. Are you
              sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && removeMutation.mutate({ serverId, id: deleteId })}
              disabled={removeMutation.isPending}
            >
              {removeMutation.isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ContentLayout>
  );
}
