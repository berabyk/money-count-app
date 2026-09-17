import type { Space, Expense } from '../types';

export const mockDb = {
  getSpaces: (): Space[] => {
    const spaces = localStorage.getItem('spaces');
    if (!spaces) {
      const defaultSpace: Space = { id: "space1", name: "Örnek Alan", members: ["mock@example.com"], createdBy: "mock@example.com", createdAt: Date.now() };
      localStorage.setItem('spaces', JSON.stringify([defaultSpace]));
      return [defaultSpace];
    }
    return JSON.parse(spaces);
  },

  saveSpace: (space: Space) => {
    const spaces = mockDb.getSpaces();
    const existingIndex = spaces.findIndex(s => s.id === space.id);
    if (existingIndex > -1) {
      spaces[existingIndex] = space;
    } else {
      spaces.push(space);
    }
    localStorage.setItem('spaces', JSON.stringify(spaces));
  },

  getExpenses: (spaceId: string): Expense[] => {
    const expenses = localStorage.getItem('expenses');
    if (!expenses) return [];
    const allExpenses: Expense[] = JSON.parse(expenses);
    return allExpenses.filter(e => e.spaceId === spaceId);
  },

  saveExpense: (expense: Expense) => {
    const expenses = localStorage.getItem('expenses');
    const allExpenses: Expense[] = expenses ? JSON.parse(expenses) : [];
    allExpenses.push(expense);
    localStorage.setItem('expenses', JSON.stringify(allExpenses));
  }
};
