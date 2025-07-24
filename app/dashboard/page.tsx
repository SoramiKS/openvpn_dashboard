import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Users, Activity, Shield } from "lucide-react";
import { dummyNodes, dummyUsers } from "@/lib/dummy-data";

export default function DashboardPage() {
  const onlineNodes = dummyNodes.filter(node => node.status === 'online').length;
  const activeUsers = dummyUsers.filter(user => user.status === 'active').length;
  const activeSessions = 12; // Dummy count

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-600">Monitor your OpenVPN infrastructure at a glance</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dummyNodes.length}</div>
            <div className="flex items-center mt-2">
              <Badge variant={onlineNodes > 0 ? "default" : "destructive"}>
                {onlineNodes} online
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dummyUsers.length}</div>
            <div className="flex items-center mt-2">
              <Badge variant="default">
                {activeUsers} active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSessions}</div>
            <p className="text-xs text-muted-foreground mt-2">
              +2 from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground mt-2">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Node Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dummyNodes.map((node) => (
                <div key={node.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{node.name}</div>
                    <div className="text-sm text-muted-foreground">{node.location}</div>
                  </div>
                  <Badge variant={node.status === 'online' ? 'default' : 'destructive'}>
                    {node.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resource Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dummyNodes.filter(node => node.status === 'online').map((node) => (
                <div key={node.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{node.name}</span>
                    <span>CPU: {node.cpuUsage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${node.cpuUsage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}