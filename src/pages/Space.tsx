import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, isMock } from '../firebase';
import { useAuth } from '../context/AuthContext';
import type { Space as SpaceType, Expense, Debt } from '../types';
import { calculateDebts } from '../utils/calculateDebts';
import { mockDb } from '../utils/mockDb';
import { ArrowLeft, Users, Receipt, CreditCard, UserPlus, Copy, Check, Calendar, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { ModeToggle } from '../components/mode-toggle';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

export const Space: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [space, setSpace] = useState<SpaceType | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Form states
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [newMemberName, setNewMemberName] = useState('');

  useEffect(() => {
    if (user) {
      setPaidBy(user.displayName || user.email || user.uid);
      fetchData();
    }
  }, [id, user]);

  const fetchData = async () => {
    if (!id || !user) return;
    const userIdentifier = user.displayName || user.email || user.uid;

    if (isMock) {
      let spaceData = mockDb.getSpaces().find(s => s.id === id);
      if (!spaceData) {
        spaceData = { id, name: "Yeni Alan", members: [userIdentifier], createdBy: userIdentifier, createdAt: Date.now() };
        mockDb.saveSpace(spaceData);
      } else if (!spaceData.members.includes(userIdentifier)) {
        spaceData.members.push(userIdentifier);
        mockDb.saveSpace(spaceData);
      }
      setSpace(spaceData);
      setExpenses(mockDb.getExpenses(id));
      setLoading(false);
      return;
    }

    try {
      const spaceDoc = await getDoc(doc(db, 'spaces', id));
      if (spaceDoc.exists()) {
        const spaceData = { id: spaceDoc.id, ...spaceDoc.data() } as SpaceType;
        if (!spaceData.members.includes(userIdentifier)) {
          await updateDoc(doc(db, 'spaces', id), { members: arrayUnion(userIdentifier) });
          spaceData.members.push(userIdentifier);
        }
        setSpace(spaceData);
      }

      const q = query(collection(db, 'expenses'), where('spaceId', '==', id));
      const expSnapshot = await getDocs(q);
      const fetchedExp: Expense[] = [];
      expSnapshot.forEach(doc => {
        fetchedExp.push({ id: doc.id, ...doc.data() } as Expense);
      });
      setExpenses(fetchedExp);
    } catch (e) {
      console.warn("Using mock data for space and expenses");
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
    if (!desc || !amount || !paidBy || !id || !space) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const newExpenseData = {
      spaceId: id,
      description: desc,
      amount: numAmount,
      paidBy: paidBy,
      createdAt: Date.now()
    };

    if (isMock) {
      const expenseWithId: Expense = { id: "exp-" + Date.now(), ...newExpenseData };
      mockDb.saveExpense(expenseWithId);
      setExpenses([...expenses, expenseWithId]);

      if (!space.members.includes(paidBy)) {
        const updatedSpace = { ...space, members: [...space.members, paidBy] };
        setSpace(updatedSpace);
        mockDb.saveSpace(updatedSpace);
      }
      setDesc('');
      setAmount('');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'expenses'), newExpenseData);
      const expenseWithId = { id: docRef.id, ...newExpenseData };
      setExpenses([...expenses, expenseWithId]);

      if (!space.members.includes(paidBy)) {
        const updatedMembers = [...space.members, paidBy];
        setSpace({ ...space, members: updatedMembers });
        await updateDoc(doc(db, 'spaces', id), { members: arrayUnion(paidBy) });
      }
    } catch (e) {
      console.error(e);
    }

    setDesc('');
    setAmount('');
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !id || !space) return;

    const name = newMemberName.trim();
    if (space.members.includes(name)) {
      setNewMemberName('');
      return;
    }

    const updatedMembers = [...space.members, name];

    if (isMock) {
      const updatedSpace = { ...space, members: updatedMembers };
      setSpace(updatedSpace);
      mockDb.saveSpace(updatedSpace);
      setNewMemberName('');
      return;
    }

    try {
      setSpace({ ...space, members: updatedMembers });
      await updateDoc(doc(db, 'spaces', id), { members: arrayUnion(name) });
      setNewMemberName('');
    } catch (e) {
      console.error("Failed to add member", e);
    }
  };

  const copyToClipboard = () => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="min-h-screen bg-background text-foreground flex items-center justify-center py-12">Yükleniyor...</div>;
  if (!space) return <div className="min-h-screen bg-background text-foreground flex items-center justify-center py-12">Alan bulunamadı.</div>;

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Group expenses by member
  const memberTotals = space.members.map(member => {
    const memberExpenses = expenses.filter(e => e.paidBy === member);
    const total = memberExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    return { member, total };
  }).sort((a, b) => b.total - a.total);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Navigation and Top Bar */}
        <div className="flex justify-between items-center">
          <Button variant="ghost" asChild className="-ml-4">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Ana Ekrana Dön
            </Link>
          </Button>
          <ModeToggle />
        </div>

        {/* Header Card */}
        <Card className="bg-primary text-primary-foreground border-none">
          <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle className="text-3xl font-bold tracking-tight">{space.name}</CardTitle>
              <div className="text-primary-foreground/80 flex items-center text-sm gap-4">
                <span className="flex items-center"><Users className="mr-1 h-4 w-4" /> {space.members.length} Üye</span>
                <span>Toplam Harcama: <strong className="font-semibold">{totalSpent.toFixed(2)} TL</strong></span>
              </div>

              <div className="mt-4 flex items-center text-xs bg-primary-foreground/10 inline-flex rounded-md p-1 pl-3 pr-1 border border-primary-foreground/20">
                <span className="opacity-70 mr-2">Kod:</span>
                <span className="font-mono tracking-wider">{id}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 hover:bg-primary-foreground/20 text-primary-foreground" onClick={copyToClipboard}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>

            <form onSubmit={handleAddMember} className="flex gap-2 w-full md:w-auto">
              <Input
                placeholder="Yeni kişi ekle..."
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 w-full md:w-48"
              />
              <Button type="submit" variant="secondary" size="icon">
                <UserPlus className="h-4 w-4" />
              </Button>
            </form>
          </CardHeader>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Col: Add Expense & Expenses List */}
          <div className="lg:col-span-2 space-y-6">

            <Card>
              <CardHeader className="pb-4 border-b">
                <CardTitle className="flex items-center text-xl">
                  <Receipt className="mr-2 h-5 w-5 text-primary" /> Harcama Ekle
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Ne alındı?</label>
                      <Input
                        required
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        placeholder="Örn: Market alışverişi"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tutar (TL)</label>
                      <Input
                        type="number"
                        required
                        min="0.01"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Kim Ödedi?</label>
                    <select
                      value={paidBy}
                      onChange={(e) => setPaidBy(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {space.members.map(m => (
                        <option key={m} value={m} className="bg-background text-foreground">{m}</option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" className="w-full">Harcamayı Ekle</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-0 border-b pb-4">
                <CardTitle className="text-xl">Kişiler ve Harcamaları</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="hidden sm:flex">
                      <Calendar className="mr-2 h-4 w-4" /> Tüm Harcama Geçmişi
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Tüm Harcama Geçmişi</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                      {expenses.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">Henüz harcama eklenmedi.</p>
                      ) : (
                        <ul className="space-y-4">
                          {expenses.slice().reverse().map(exp => (
                            <li key={exp.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                              <div>
                                <p className="font-medium">{exp.description}</p>
                                <div className="flex items-center text-xs text-muted-foreground mt-1 gap-2">
                                  <span className="font-medium text-foreground">{exp.paidBy}</span>
                                  <span>•</span>
                                  <span>{new Date(exp.createdAt).toLocaleString('tr-TR')}</span>
                                </div>
                              </div>
                              <span className="font-semibold">{exp.amount.toFixed(2)} TL</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="divide-y divide-border">
                  {memberTotals.map((mt) => (
                    <li key={mt.member}>
                      <Link
                        to={`/space/${id}/member/${encodeURIComponent(mt.member)}`}
                        className="py-4 flex justify-between items-center gap-4 hover:bg-muted/50 px-2 -mx-2 rounded-md transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {mt.member.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{mt.member}</p>
                            <p className="text-sm text-muted-foreground">Detayları gör</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-lg">{mt.total.toFixed(2)} TL</span>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 sm:hidden">
                   <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Calendar className="mr-2 h-4 w-4" /> Tüm Harcama Geçmişi
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto w-[90vw]">
                      <DialogHeader>
                        <DialogTitle>Tüm Harcama Geçmişi</DialogTitle>
                      </DialogHeader>
                      <div className="mt-4">
                        {expenses.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">Henüz harcama eklenmedi.</p>
                        ) : (
                          <ul className="space-y-4">
                            {expenses.slice().reverse().map(exp => (
                              <li key={exp.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                <div>
                                  <p className="font-medium">{exp.description}</p>
                                  <div className="flex items-center text-xs text-muted-foreground mt-1 gap-2">
                                    <span className="font-medium text-foreground">{exp.paidBy}</span>
                                    <span>•</span>
                                    <span>{new Date(exp.createdAt).toLocaleString('tr-TR')}</span>
                                  </div>
                                </div>
                                <span className="font-semibold">{exp.amount.toFixed(2)} TL</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Col: Debts / Settlement */}
          <div className="lg:col-span-1">
            <Card className="bg-secondary/30 h-full">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <CreditCard className="mr-2 h-5 w-5 text-primary" /> Kim Kime Ne Verecek?
                </CardTitle>
                <CardDescription>Minimum işlem ile borç sadeleştirme</CardDescription>
              </CardHeader>
              <CardContent>
                {debts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                    <p>Herkesin hesabı eşit,</p>
                    <p>borç yok! 🎉</p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {debts.map((debt, idx) => (
                      <li key={idx} className="bg-background p-4 rounded-xl shadow-sm border">
                        <div className="flex flex-col">
                          <div className="font-medium text-destructive truncate" title={debt.from}>
                            {debt.from}
                          </div>
                          <div className="text-xs text-muted-foreground my-1 flex items-center">
                            ödeyecek <ArrowLeft className="inline ml-1 h-3 w-3 rotate-180" />
                          </div>
                          <div className="font-medium text-emerald-600 dark:text-emerald-400 truncate" title={debt.to}>
                            {debt.to}
                          </div>
                        </div>
                        <div className="mt-3 text-right text-lg font-bold">
                          {debt.amount.toFixed(2)} TL
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};
