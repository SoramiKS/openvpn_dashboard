export interface Node {
  id: string;
  name: string;
  ipAddress: string;
  status: 'online' | 'offline';
  cpuUsage: number;
  ramUsage: number;
  location: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'revoked';
  lastLogin: string;
}

export interface VPNProfile {
  id: string;
  name: string;
  assignedNode: string;
  createdAt: string;
  isActive: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  node: string;
  action: string;
  status: 'success' | 'error' | 'warning';
  details: string;
}

export const dummyNodes: Node[] = [
  {
    id: '1',
    name: 'US-East-1',
    ipAddress: '192.168.1.10',
    status: 'online',
    cpuUsage: 45,
    ramUsage: 67,
    location: 'New York, US'
  },
  {
    id: '2',
    name: 'EU-West-1', 
    ipAddress: '192.168.1.11',
    status: 'online',
    cpuUsage: 23,
    ramUsage: 34,
    location: 'London, UK'
  },
  {
    id: '3',
    name: 'APAC-1',
    ipAddress: '192.168.1.12',
    status: 'offline',
    cpuUsage: 0,
    ramUsage: 0,
    location: 'Singapore'
  },
  {
    id: '4',
    name: 'US-West-1',
    ipAddress: '192.168.1.13',
    status: 'online',
    cpuUsage: 78,
    ramUsage: 56,
    location: 'California, US'
  }
];

export const dummyUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@company.com',
    role: 'admin',
    status: 'active',
    lastLogin: '2024-01-15 14:32:00'
  },
  {
    id: '2',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@company.com',
    role: 'user',
    status: 'active',
    lastLogin: '2024-01-15 09:15:00'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@company.com',
    role: 'user',
    status: 'revoked',
    lastLogin: '2024-01-10 16:45:00'
  },
  {
    id: '4',
    name: 'Emily Chen',
    email: 'emily.chen@company.com',
    role: 'user',
    status: 'active',
    lastLogin: '2024-01-14 11:20:00'
  }
];

export const dummyProfiles: VPNProfile[] = [
  {
    id: '1',
    name: 'john-doe-profile',
    assignedNode: 'US-East-1',
    createdAt: '2024-01-10',
    isActive: true
  },
  {
    id: '2',
    name: 'sarah-wilson-profile',
    assignedNode: 'EU-West-1',
    createdAt: '2024-01-12',
    isActive: true
  },
  {
    id: '3',
    name: 'emily-chen-profile',
    assignedNode: 'US-West-1',
    createdAt: '2024-01-14',
    isActive: true
  }
];

export const dummyLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: '2024-01-15 14:32:15',
    node: 'US-East-1',
    action: 'User login',
    status: 'success',
    details: 'john.doe@company.com successfully authenticated'
  },
  {
    id: '2',
    timestamp: '2024-01-15 14:30:42',
    node: 'EU-West-1',
    action: 'Connection established',
    status: 'success',
    details: 'Client 192.168.1.50 connected successfully'
  },
  {
    id: '3',
    timestamp: '2024-01-15 14:28:33',
    node: 'APAC-1',
    action: 'Node offline',
    status: 'error',
    details: 'Node became unresponsive - connection timeout'
  },
  {
    id: '4',
    timestamp: '2024-01-15 14:25:19',
    node: 'US-West-1',
    action: 'Certificate renewal',
    status: 'warning',
    details: 'Certificate will expire in 7 days'
  },
  {
    id: '5',
    timestamp: '2024-01-15 14:20:05',
    node: 'US-East-1',
    action: 'User disconnected',
    status: 'success',
    details: 'sarah.wilson@company.com session ended'
  }
];