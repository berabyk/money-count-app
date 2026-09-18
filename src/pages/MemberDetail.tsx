import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, isMock } from '../firebase';
import { useAuth } from '../context/AuthContext';
import type { Space as SpaceType, Expense, Debt } from '../types';
import { calculateDebts } from '../utils/calculateDebts';
import { mockDb } from '../utils/mockDb';
import { ArrowLeft, Receipt, CreditCard } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { ModeToggle } from '../components/mode-toggle';

export const MemberDetail: React.FC = () => {
  const { id, memberName } = useParams<{ id: string, memberName: string }>();
  const decodedMemberName = decodeURIComponent(memberName || '');
  const { user } = useAuth();

  const [space, setSpace] = useState<SpaceType | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && id) {
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

  if (loading) return <div className="min-h-screen bg-background text-foreground flex items-center justify-center py-12">Yükleniyor...</div>;
  if (!space) return <div className="min-h-screen bg-background text-foreground flex items-center justify-center py-12">Alan bulunamadı.</div>;

  // Filter expenses and debts for this specific member
  const memberExpenses = expenses.filter(e => e.paidBy === decodedMemberName);
  const totalSpentByMember = memberExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  const debtsOwedByMember = debts.filter(d => d.from === decodedMemberName);
  const debtsOwedToMember = debts.filter(d => d.to === decodedMemberName);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Navigation and Top Bar */}
        <div className="flex justify-between items-center">
          <Button variant="ghost" asChild className="-ml-4">
            <Link to={`/space/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {space.name} Alanına Dön
            </Link>
          </Button>
          <ModeToggle />
        </div>

        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-8">
           <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
              {decodedMemberName.charAt(0).toUpperCase()}
           </div>
           <div>
             <h1 className="text-3xl font-bold tracking-tight">{decodedMemberName}</h1>
             <p className="text-muted-foreground text-sm mt-1">Harcama ve Borç Özeti</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Summary Cards */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-muted-foreground">
                <Receipt className="mr-2 h-4 w-4" /> Toplam Yaptığı Harcama
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{totalSpentByMember.toFixed(2)} TL</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary">
             <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-muted-foreground">
                <CreditCard className="mr-2 h-4 w-4" /> Borç Durumu
              </CardTitle>
            </CardHeader>
            <CardContent>
              {debtsOwedByMember.length === 0 && debtsOwedToMember.length === 0 ? (
                <div className="text-lg font-medium text-emerald-600">Herkesle ödeşmiş, borcu yok.</div>
              ) : (
                <div className="space-y-4">
                  {debtsOwedByMember.length > 0 && (
                     <div>
                       <p className="text-sm font-semibold text-destructive mb-2">Ödemesi Gerekenler:</p>
                       <ul className="space-y-2">
                         {debtsOwedByMember.map((d, i) => (
                           <li key={i} className="flex justify-between items-center bg-destructive/10 px-3 py-2 rounded-md text-sm">
                             <span>Kime: <strong className="ml-1">{d.to}</strong></span>
                             <span className="font-bold text-destructive">{d.amount.toFixed(2)} TL</span>
                           </li>
                         ))}
                       </ul>
                     </div>
                  )}

                  {debtsOwedToMember.length > 0 && (
                     <div>
                       <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2">Alacakları:</p>
                       <ul className="space-y-2">
                         {debtsOwedToMember.map((d, i) => (
                           <li key={i} className="flex justify-between items-center bg-emerald-500/10 px-3 py-2 rounded-md text-sm">
                             <span>Kimden: <strong className="ml-1">{d.from}</strong></span>
                             <span className="font-bold text-emerald-600 dark:text-emerald-400">{d.amount.toFixed(2)} TL</span>
                           </li>
                         ))}
                       </ul>
                     </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Detailed Expenses List */}
        <Card className="mt-8">
           <CardHeader>
             <CardTitle>Yaptığı Harcamalar</CardTitle>
             <CardDescription>{decodedMemberName} tarafından bu alanda yapılan tüm harcamalar.</CardDescription>
           </CardHeader>
           <CardContent>
              {memberExpenses.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Kayıtlı harcaması bulunmuyor.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {memberExpenses.slice().reverse().map(exp => (
                    <li key={exp.id} className="py-4 flex justify-between items-center gap-4">
                      <div>
                        <p className="font-medium">{exp.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(exp.createdAt).toLocaleString('tr-TR')}
                        </p>
                      </div>
                      <span className="font-semibold whitespace-nowrap text-lg">{exp.amount.toFixed(2)} TL</span>
                    </li>
                  ))}
                </ul>
              )}
           </CardContent>
        </Card>

      </div>
    </div>
  );
};
