import type { Expense, Debt } from '../types';

export function calculateDebts(expenses: Expense[], members: string[]): Debt[] {
  if (members.length === 0) return [];

  // 1. Calculate how much each member has paid in total
  const paidAmounts: Record<string, number> = {};
  members.forEach(m => (paidAmounts[m] = 0));

  let totalExpense = 0;
  expenses.forEach(exp => {
    totalExpense += exp.amount;
    if (paidAmounts[exp.paidBy] !== undefined) {
      paidAmounts[exp.paidBy] += exp.amount;
    } else {
      // If someone paid who is not in the list, just add them (robustness)
      paidAmounts[exp.paidBy] = exp.amount;
      if (!members.includes(exp.paidBy)) {
        members.push(exp.paidBy);
      }
    }
  });

  if (totalExpense === 0 || members.length === 0) return [];

  // 2. Calculate average (fair share) per member
  const fairShare = totalExpense / members.length;

  // 3. Calculate balances (who owes and who is owed)
  // Negative balance means they OWE money (they paid less than fair share)
  // Positive balance means they are OWED money (they paid more than fair share)
  const balances = members.map(m => ({
    member: m,
    balance: paidAmounts[m] - fairShare
  }));

  const debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);
  const creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);

  const debts: Debt[] = [];

  let i = 0; // debtors index
  let j = 0; // creditors index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(-debtor.balance, creditor.balance);

    debts.push({
      from: debtor.member,
      to: creditor.member,
      amount: Number(amount.toFixed(2))
    });

    debtor.balance += amount;
    creditor.balance -= amount;

    if (Math.abs(debtor.balance) < 0.01) i++;
    if (Math.abs(creditor.balance) < 0.01) j++;
  }

  return debts;
}
