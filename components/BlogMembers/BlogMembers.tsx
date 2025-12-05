"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addBlogMember, removeBlogMember } from "@/src/server/services/blogs/members/mutations";
import { Loader2, Trash2, UserPlus } from "lucide-react";

interface BlogMember {
  id: string;
  userEmail: string;
  createdAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface BlogMembersProps {
  blogId: string;
  members: BlogMember[];
  ownerEmail: string;
  isOwner: boolean;
}

export function BlogMembers({ blogId, members: initialMembers, ownerEmail, isOwner }: BlogMembersProps) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsAdding(true);

    try {
      const result = await addBlogMember(blogId, email);

      if (result.error) {
        setError(result.error);
        setIsAdding(false);
      } else {
        setEmail("");
        setSuccessMessage(`Successfully added ${email} as a member`);
        setIsAdding(false);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
      setIsAdding(false);
    }
  }

  async function handleRemoveMember(memberId: string, memberEmail: string) {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from this blog?`)) {
      return;
    }

    setError("");
    setSuccessMessage("");
    setRemovingId(memberId);

    try {
      const result = await removeBlogMember(blogId, memberId);

      if (result.error) {
        setError(result.error);
        setRemovingId(null);
      } else {
        setMembers(members.filter((m) => m.id !== memberId));
        setSuccessMessage(`Successfully removed ${memberEmail} from the blog`);
        setRemovingId(null);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
      setRemovingId(null);
    }
  }

  // Combine owner and members for display
  const allMembers = [
    {
      id: "owner",
      userEmail: ownerEmail,
      createdAt: new Date(),
      user: null,
      isOwner: true,
    },
    ...members.map((m) => ({ ...m, isOwner: false })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Members</h2>
        <p className="text-sm text-muted-foreground">
          Members can access and edit this blog. The owner is automatically a member.
        </p>
      </div>

      {/* List of members */}
      <div className="space-y-2">
        {allMembers.map((member) => (
          <Card key={member.id}>
            <CardContent className="flex items-center justify-between px-4 py-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{member.userEmail}</span>
                  {member.isOwner && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Owner
                    </span>
                  )}
                  {member.user?.name && (
                    <span className="text-sm text-muted-foreground">
                      ({member.user.name})
                    </span>
                  )}
                </div>
                {member.user ? (
                  <p className="text-xs text-muted-foreground">Registered user</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Pending - user not registered yet</p>
                )}
              </div>
              {isOwner && !member.isOwner && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveMember(member.id, member.userEmail)}
                  disabled={removingId === member.id}
                >
                  {removingId === member.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add member form (only for owner) */}
      {isOwner && (
        <Card>
          <CardContent className="px-4 py-3">
            <form onSubmit={handleAddMember} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email">Add Member by Email</Label>
                <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isAdding}
                  className="flex-1"
                />
                <Button type="submit" disabled={isAdding || !email.trim()}>
                  {isAdding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add
                    </>
                  )}
                </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
          <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}
    </div>
  );
}

