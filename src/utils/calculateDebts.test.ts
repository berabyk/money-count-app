import { calculateDebts } from './calculateDebts';
import type { Expense } from '../types';

function runTests() {
  console.log("Running calculateDebts tests...");

  const members = ["A", "B", "C"];
  const expenses: Expense[] = [
    { id: "1", spaceId: "1", description: "Food", amount: 90, paidBy: "A", createdAt: 0 },
  ];

  const debts = calculateDebts(expenses, members);

  // Total = 90. Fair share = 30.
  // A paid 90 (owes -60, so owed 60).
  // B paid 0 (owes 30).
  // C paid 0 (owes 30).

  console.log("Test 1 Result:");
  console.dir(debts);

  if (debts.length === 2 &&
      ((debts[0].from === "B" && debts[0].amount === 30 && debts[0].to === "A") ||
       (debts[1].from === "B" && debts[1].amount === 30 && debts[1].to === "A"))) {
    console.log("Test 1 PASS");
  } else {
    console.log("Test 1 FAIL");
  }
}

runTests();
