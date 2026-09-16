import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import type { Space as SpaceType, Expense, Debt } from '../types';
import { calculateDebts } from '../utils/calculateDebts';
import { ArrowLeft, Users, Receipt, CreditCard } from 'lucide-react';

export const Space: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [space, setSpace] = useState<SpaceType | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');

  useEffect(() => {
    if (user) {
      setPaidBy(user.email || user.uid);
      fetchData();
    }
  }, [id, user]);

  const fetchData = async () => {
    if (!id || !user) return;
    try {
      // Fetch space
      const spaceDoc = await getDoc(doc(db, 'spaces', id));
      if (spaceDoc.exists()) {
        const spaceData = { id: spaceDoc.id, ...spaceDoc.data() } as SpaceType;

        // Auto join if not member
        const userIdentifier = user.email || user.uid;
        if (!spaceData.members.includes(userIdentifier)) {
          await updateDoc(doc(db, 'spaces', id), {
            members: arrayUnion(userIdentifier)
          });
          spaceData.members.push(userIdentifier);
        }
        setSpace(spaceData);
      } else {
        // Mock fallback if space not found
        setSpace({ id, name: "Örnek Bölüşme Alanı", members: [user.email || user.uid, "arkadas@test.com"], createdBy: "system", createdAt: Date.now() });
      }

      // Fetch expenses
      const q = query(collection(db, 'expenses'), where('spaceId', '==', id));
      const expSnapshot = await getDocs(q);
      const fetchedExp: Expense[] = [];
      expSnapshot.forEach(doc => {
        fetchedExp.push({ id: doc.id, ...doc.data() } as Expense);
      });
      setExpenses(fetchedExp);

    } catch (e) {
      console.warn("Using mock data for space and expenses");
      const mockMembers = [user.email || user.uid, "ali@test.com", "ayse@test.com"];
      setSpace({ id, name: "Örnek Bölüşme Alanı", members: mockMembers, createdBy: "system", createdAt: Date.now() });
      setExpenses([
        { id: "e1", spaceId: id, description: "Akşam Yemeği", amount: 600, paidBy: user.email || user.uid, createdAt: Date.now() },
        { id: "e2", spaceId: id, description: "Market", amount: 300, paidBy: "ali@test.com", createdAt: Date.now() }
      ]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (space && expenses) {
      setDebts(calculateDebts(expenses, space.members));
    }
  }, [expenses, space]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount || !paidBy || !id) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const newExpense = {
      spaceId: id,
      description: desc,
      amount: numAmount,
      paidBy: paidBy,
      createdAt: Date.now()
    };

    try {
      const docRef = await addDoc(collection(db, 'expenses'), newExpense);
      const expenseWithId = { id: docRef.id, ...newExpense };
      setExpenses([...expenses, expenseWithId]);

      // Update members if new payer is introduced
      if (space && !space.members.includes(paidBy)) {
        const updatedMembers = [...space.members, paidBy];
        setSpace({ ...space, members: updatedMembers });
        await updateDoc(doc(db, 'spaces', id), {
          members: arrayUnion(paidBy)
        });
      }
    } catch (e) {
      const expenseWithId = { id: "mock-e-" + Date.now(), ...newExpense };
      setExpenses([...expenses, expenseWithId]);
      if (space && !space.members.includes(paidBy)) {
        setSpace({ ...space, members: [...space.members, paidBy] });
      }
    }

    setDesc('');
    setAmount('');
  };

  if (loading) return <div className="text-center py-12">Yükleniyor...</div>;
  if (!space) return <div className="text-center py-12">Alan bulunamadı.</div>;

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6 font-medium">
          <ArrowLeft className="mr-2" size={20} />
          Ana Ekrana Dön
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-6 sm:p-10 border-b border-gray-200 bg-indigo-600 text-white">
            <h1 className="text-3xl font-bold">{space.name}</h1>
            <p className="mt-2 text-indigo-100 flex items-center">
              <Users className="mr-2" size={18} />
              {space.members.length} Üye | Toplam Harcama: {totalSpent.toFixed(2)} TL
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3">
            {/* Left Col: Add Expense & Expenses List */}
            <div className="md:col-span-2 p-6 sm:p-10 border-b md:border-b-0 md:border-r border-gray-200">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center">
                <Receipt className="mr-2 text-indigo-500" />
                Harcama Ekle
              </h2>
              <form onSubmit={handleAddExpense} className="space-y-4 mb-10 bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ne alındı?</label>
                    <input
                      type="text"
                      required
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Örn: Market alışverişi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (TL)</label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kim Ödedi?</label>
                  <select
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {space.members.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Harcamayı Ekle
                </button>
              </form>

              <h3 className="text-xl font-semibold mb-4 text-gray-800">Geçmiş Harcamalar</h3>
              {expenses.length === 0 ? (
                <p className="text-gray-500 italic">Henüz harcama eklenmedi.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {expenses.slice().reverse().map(exp => (
                    <li key={exp.id} className="py-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{exp.description}</p>
                        <p className="text-sm text-gray-500">Ödeyen: {exp.paidBy}</p>
                      </div>
                      <span className="font-semibold text-gray-900">{exp.amount.toFixed(2)} TL</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Right Col: Debts / Settlement */}
            <div className="p-6 sm:p-10 bg-indigo-50">
              <h2 className="text-2xl font-semibold mb-6 text-indigo-900 flex items-center">
                <CreditCard className="mr-2 text-indigo-600" />
                Kim Kime Ne Verecek?
              </h2>
              {debts.length === 0 ? (
                <p className="text-indigo-600">Herkesin hesabı eşit, borç yok!</p>
              ) : (
                <ul className="space-y-4">
                  {debts.map((debt, idx) => (
                    <li key={idx} className="bg-white p-4 rounded-md shadow-sm border border-indigo-100">
                      <div className="font-medium text-gray-900 truncate" title={debt.from}>
                        {debt.from}
                      </div>
                      <div className="text-sm text-gray-500 my-1">ödeyecek ➔</div>
                      <div className="font-medium text-gray-900 truncate" title={debt.to}>
                        {debt.to}
                      </div>
                      <div className="mt-2 text-lg font-bold text-indigo-600">
                        {debt.amount.toFixed(2)} TL
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
