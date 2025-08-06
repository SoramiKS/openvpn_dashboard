"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Save, X, Loader2, Copy } from "lucide-react";
// Import Type Node langsung dari prisma client
import { Node, NodeStatus } from "@/lib/generated/prisma";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Toast } from "@radix-ui/react-toast";
import { Toaster } from "@/components/ui/toaster";
import NodeCopyButton from "@/components/NodeCopyButton";

// Extend Node type for frontend use if needed, e.g., for initial form state
// In this case, we need to add 'ipAddress' temporarily for form state before mapping to 'ip'
interface NodeFormInput {
  name: string;
  ipAddress: string; // Used for form input, will map to 'ip' in backend
  location: string;
  token: string;
}

export default function NodesPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // Initial state for new node form, including token
  const [newNode, setNewNode] = useState<NodeFormInput>({
    name: "",
    ipAddress: "",
    location: "",
    token: "",
  });
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  // Use Partial<Node> for editedNode to allow partial updates
  const [editedNode, setEditedNode] = useState<Partial<NodeFormInput> | null>(
    null
  ); // Keep ipAddress here for edit form
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchNodes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/nodes");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Node[] = await response.json();
      setNodes(data);
    } catch (error) {
      console.error("Failed to fetch nodes:", error);
      toast({
        title: "Error",
        description: "Failed to load nodes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  const handleAddNode = async () => {
    // Validate required fields including token
    if (
      !newNode.name.trim() ||
      !newNode.ipAddress.trim() ||
      !newNode.token.trim()
    ) {
      toast({
        title: "Input Error",
        description: "Name, IP Address, and Token cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/nodes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Send ipAddress as 'ip' to match backend Prisma schema
        body: JSON.stringify({
          name: newNode.name,
          ipAddress: newNode.ipAddress, // This will be mapped to 'ip' on backend
          location: newNode.location,
          token: newNode.token,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add node.");
      }

      toast({
        title: "Success",
        description: "Node added successfully!",
      });
      // Reset form fields
      setNewNode({ name: "", ipAddress: "", location: "", token: "" });
      setIsAddModalOpen(false);
      await fetchNodes(); // Re-fetch nodes to update the list
    } catch (error) {
      console.error("Error adding node:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error && error.message
            ? error.message
            : "Failed to add node. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (node: Node) => {
    setEditingNodeId(node.id);
    // Create a shallow copy for editing, map 'ip' back to 'ipAddress' for form, and ensure location is a string
    setEditedNode({
      name: node.name,
      ipAddress: node.ip, // Map 'ip' from database to 'ipAddress' for form
      location: node.location ?? "", // Ensure location is a string
      token: node.token,
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedNode((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const saveEditedNode = async () => {
    if (!editedNode || !editingNodeId) return;

    if (!editedNode.name?.trim() || !editedNode.ipAddress?.trim()) {
      toast({
        title: "Input Error",
        description: "Name and IP Address cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Use dynamic route for PUT request
      const response = await fetch(`/api/nodes/${editingNodeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editedNode.name,
          ipAddress: editedNode.ipAddress, // Send ipAddress, backend will map to 'ip'
          location: editedNode.location,
          // Token is typically not updated via this form, so don't send it.
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update node.");
      }

      toast({
        title: "Success",
        description: "Node updated successfully!",
      });
      setEditingNodeId(null);
      setEditedNode(null);
      await fetchNodes(); // Re-fetch nodes to update the list
    } catch (error) {
      console.error("Error saving node:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error && error.message
            ? error.message
            : "Failed to update node. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelEditing = () => {
    setEditingNodeId(null);
    setEditedNode(null);
  };

  const handleDeleteNode = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this node?")) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Use dynamic route for DELETE request
      const response = await fetch(`/api/nodes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete node.");
      }

      toast({
        title: "Success",
        description: "Node deleted successfully!",
      });
      await fetchNodes(); // Re-fetch nodes to update the list
    } catch (error) {
      console.error("Error deleting node:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error && error.message
            ? error.message
            : "Failed to delete node. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nodes</h1>
          <p className="text-gray-600">Manage your OpenVPN server nodes</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Add Node
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Server Nodes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">Loading nodes...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Service Status</TableHead> {/* New column */}
                  <TableHead>CPU Usage</TableHead>
                  <TableHead>RAM Usage</TableHead>
                  <TableHead>Last Seen</TableHead> {/* New column */}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nodes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9} // Updated colspan to match new columns
                      className="text-center py-8 text-gray-500"
                    >
                      No nodes found. Add a new node to get started!
                    </TableCell>
                  </TableRow>
                ) : (
                  nodes.map((node) => (
                    <TableRow key={node.id}>
                      {/* Name Cell */}
                      <TableCell className="font-medium">
                        {editingNodeId === node.id ? (
                          <Input
                            name="name"
                            value={editedNode?.name || ""}
                            onChange={handleEditChange}
                            className="w-full"
                            disabled={isSubmitting}
                          />
                        ) : (
                          node.name
                        )}
                      </TableCell>
                      {/* IP Address Cell */}
                      <TableCell>
                        {editingNodeId === node.id ? (
                          <Input
                            name="ipAddress" // Keep ipAddress for form field
                            value={editedNode?.ipAddress || ""}
                            onChange={handleEditChange}
                            className="w-full"
                            disabled={isSubmitting}
                          />
                        ) : (
                          node.ip // Display 'ip' from database
                        )}
                      </TableCell>
                      {/* Location Cell */}
                      <TableCell>
                        {editingNodeId === node.id ? (
                          <Input
                            name="location"
                            value={editedNode?.location || ""}
                            onChange={handleEditChange}
                            className="w-full"
                            disabled={isSubmitting}
                          />
                        ) : (
                          node.location
                        )}
                      </TableCell>
                      {/* Status Cell */}
                      <TableCell>
                        <Badge
                          variant={
                            node.status === NodeStatus.ONLINE
                              ? "default"
                              : node.status === NodeStatus.OFFLINE
                              ? "destructive"
                              : "secondary" // For UNKNOWN/ERROR
                          }
                        >
                          {node.status}
                        </Badge>
                      </TableCell>
                      {/* Service Status Cell */}
                      <TableCell>
                        <Badge
                          variant={
                            node.serviceStatus === "running"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {node.serviceStatus}
                        </Badge>
                      </TableCell>
                      {/* CPU Usage Cell */}
                      <TableCell>
                        {node.status === NodeStatus.ONLINE ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  (node.cpuUsage || 0) > 80
                                    ? "bg-red-500"
                                    : (node.cpuUsage || 0) > 60
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                                style={{ width: `${node.cpuUsage || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">
                              {node.cpuUsage || 0}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      {/* RAM Usage Cell */}
                      <TableCell>
                        {node.status === NodeStatus.ONLINE ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  (node.ramUsage || 0) > 80
                                    ? "bg-red-500"
                                    : (node.ramUsage || 0) > 60
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                                style={{ width: `${node.ramUsage || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">
                              {node.ramUsage || 0}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      {/* Last Seen Cell */}
                      <TableCell>
                        {node.lastSeen
                          ? new Date(node.lastSeen).toLocaleString()
                          : "Never"}
                      </TableCell>
                      {/* Actions Cell */}
                      <TableCell>
                        {editingNodeId === node.id ? (
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={saveEditedNode}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                              <span className="ml-1">Save</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={cancelEditing}
                              disabled={isSubmitting}
                            >
                              <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditing(node)}
                              disabled={isSubmitting}
                            >
                              <Edit className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteNode(node.id)}
                              disabled={isSubmitting}
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </Button>
                            <NodeCopyButton nodeId={node.id} />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Node Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Node</DialogTitle>
            <DialogDescription>
              Enter the details for the new server node.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={newNode.name}
                onChange={(e) =>
                  setNewNode({ ...newNode, name: e.target.value })
                }
                className="col-span-3"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ipAddress" className="text-right">
                IP Address
              </Label>
              <Input
                id="ipAddress"
                name="ipAddress"
                value={newNode.ipAddress}
                onChange={(e) =>
                  setNewNode({ ...newNode, ipAddress: e.target.value })
                }
                className="col-span-3"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                id="location"
                name="location"
                value={newNode.location}
                onChange={(e) =>
                  setNewNode({ ...newNode, location: e.target.value })
                }
                className="col-span-3"
                disabled={isSubmitting}
              />
            </div>
            {/* New Input for Token */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="token" className="text-right">
                Auth Token
              </Label>
              <Input
                id="token"
                name="token"
                value={newNode.token}
                onChange={(e) =>
                  setNewNode({ ...newNode, token: e.target.value })
                }
                className="col-span-3"
                disabled={isSubmitting}
                placeholder="Unique token for agent"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddNode} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Add Node
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster />
    </div>
  );
}
