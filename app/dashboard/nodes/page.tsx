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
import { Plus } from "lucide-react";
import { dummyNodes } from "@/lib/dummy-data";

export default function NodesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nodes</h1>
          <p className="text-gray-600">Manage your OpenVPN server nodes</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Node
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Server Nodes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>CPU Usage</TableHead>
                <TableHead>RAM Usage</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dummyNodes.map((node) => (
                <TableRow key={node.id}>
                  <TableCell className="font-medium">{node.name}</TableCell>
                  <TableCell>{node.ipAddress}</TableCell>
                  <TableCell>{node.location}</TableCell>
                  <TableCell>
                    <Badge variant={node.status === 'online' ? 'default' : 'destructive'}>
                      {node.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {node.status === 'online' ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              node.cpuUsage > 80 ? 'bg-red-500' :
                              node.cpuUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${node.cpuUsage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{node.cpuUsage}%</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {node.status === 'online' ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              node.ramUsage > 80 ? 'bg-red-500' :
                              node.ramUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${node.ramUsage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{node.ramUsage}%</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}