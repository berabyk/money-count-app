export interface User {
  uid: string;
  email: string;
  displayName: string;
}

export interface Space {
  id: string;
  name: string;
  members: string[]; // List of user emails or UIDs
  createdBy: string;
  createdAt: number;
}

export interface Expense {
  id: string;
  spaceId: string;
  description: string;
  amount: number;
  paidBy: string; // email or UID
  createdAt: number;
}

export interface Debt {
  from: string;
  to: string;
  amount: number;
}
