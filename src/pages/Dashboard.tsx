import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db, isMock } from '../firebase';
import { useAuth } from '../context/AuthContext';
import type { Space } from '../types';
import { mockDb } from '../utils/mockDb';
import { PlusCircle, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ModeToggle } from '../components/mode-toggle';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [joinSpaceId, setJoinSpaceId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchSpaces();
  }, [user, navigate]);

  const fetchSpaces = async () => {
    if (!user) return;

    const userIdentifier = user.displayName || user.email || user.uid;

    if (isMock) {
      const allSpaces = mockDb.getSpaces();
      const userSpaces = allSpaces.filter(s => s.members.includes(userIdentifier));
      setSpaces(userSpaces);
      setLoading(false);
      return;
    }

    try {
      const q = query(collection(db, 'spaces'), where('members', 'array-contains', userIdentifier));
      const querySnapshot = await getDocs(q);
      const fetchedSpaces: Space[] = [];
      querySnapshot.forEach((doc) => {
        fetchedSpaces.push({ id: doc.id, ...doc.data() } as Space);
      });
      setSpaces(fetchedSpaces);
    } catch (e) {
      console.warn("Failed to fetch from real DB");
      console.dir(e);
    }
    setLoading(false);
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim() || !user) return;

    const userIdentifier = user.displayName || user.email || user.uid;

    const newSpaceData = {
      name: newSpaceName,
      members: [userIdentifier],
      createdBy: userIdentifier,
      createdAt: Date.now()
    };

    if (isMock) {
      const newSpace: Space = { id: "space-" + Date.now(), ...newSpaceData };
      mockDb.saveSpace(newSpace);
      setSpaces([...spaces, newSpace]);
      setNewSpaceName('');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'spaces'), newSpaceData);
      setSpaces([...spaces, { id: docRef.id, ...newSpaceData }]);
      setNewSpaceName('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoinSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinSpaceId.trim()) {
      navigate(`/space/${joinSpaceId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 text-primary">
            <LayoutDashboard className="h-8 w-8" />
            <h1 className="text-3xl font-bold tracking-tight">Alanlarım</h1>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button variant="ghost" onClick={() => { logout(); navigate('/login'); }}>
              <LogOut className="mr-2 h-4 w-4" /> Çıkış
            </Button>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Yeni Alan Oluştur</CardTitle>
              <CardDescription>Beraber harcama yapacağınız yeni bir grup kurun.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSpace} className="flex gap-2">
                <Input
                  placeholder="Örn: Antalya Tatili"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">
                  <PlusCircle className="mr-2 h-4 w-4" /> Oluştur
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Mevcut Alana Katıl</CardTitle>
              <CardDescription>Arkadaşınızdan aldığınız kod ile bir alana katılın.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinSpace} className="flex gap-2">
                <Input
                  placeholder="Alan ID'sini girin"
                  value={joinSpaceId}
                  onChange={(e) => setJoinSpaceId(e.target.value)}
                  className="flex-1"
                />
                <Button variant="secondary" type="submit">Katıl</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Spaces List */}
        <div>
          <h2 className="text-2xl font-semibold tracking-tight mb-4">Grup ve Tatillerim</h2>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
          ) : spaces.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <LayoutDashboard className="h-12 w-12 mb-4 opacity-20" />
                <p>Henüz bir bölüşme alanınız yok.</p>
                <p className="text-sm">Yukarıdan yeni bir tane oluşturabilirsiniz.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {spaces.map((space) => (
                <Link key={space.id} to={`/space/${space.id}`}>
                  <Card className="h-full hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer border-l-4 border-l-primary">
                    <CardHeader>
                      <CardTitle className="truncate">{space.name}</CardTitle>
                      <CardDescription>{space.members.length} Üye</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
