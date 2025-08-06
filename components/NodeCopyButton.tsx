"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";


export default function NodeCopyButton({ nodeId }: { nodeId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setOpen(true);
            }}
          >
            <Copy className="h-4 w-4 mr-1" /> Show ID
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Node ID</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <div className="p-2 bg-muted rounded text-sm font-mono break-all">
              {nodeId}
            </div>
            <Button
              className="mt-2"
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(nodeId).then(() => {
                    toast({
                      title: "Copied",
                      description: `Node ID ${nodeId} copied to clipboard!`,
                    });
                  }).catch(() => {
                    toast({
                      title: "Clipboard Error",
                      description: "Failed to copy to clipboard. Try manually.",
                      variant: "destructive",
                    });
                  });
                } else {
                  toast({
                    title: "Clipboard Not Supported",
                    description: "Your browser doesn’t support copying. Please copy manually.",
                    variant: "destructive",
                  });
                }
              }}
            >
              Copy to Clipboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
