import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import type { Space } from '../types';
import { PlusCircle, LogOut } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
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
    try {
      const q = query(collection(db, 'spaces'), where('members', 'array-contains', user.email || user.uid));
      const querySnapshot = await getDocs(q);
      const fetchedSpaces: Space[] = [];
      querySnapshot.forEach((doc) => {
        fetchedSpaces.push({ id: doc.id, ...doc.data() } as Space);
      });
      setSpaces(fetchedSpaces);
    } catch (e) {
      console.warn("Failed to fetch from real DB, using dummy data");
      setSpaces([
        { id: "space1", name: "Tatil Masrafları", members: [user.email || user.uid], createdBy: user.uid, createdAt: Date.now() }
      ]);
    }
    setLoading(false);
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim() || !user) return;
    try {
      const newSpace = {
        name: newSpaceName,
        members: [user.email || user.uid],
        createdBy: user.uid,
        createdAt: Date.now()
      };
      const docRef = await addDoc(collection(db, 'spaces'), newSpace);
      setSpaces([...spaces, { id: docRef.id, ...newSpace }]);
      setNewSpaceName('');
    } catch (e) {
      console.warn("Mock creating space");
      setSpaces([...spaces, { id: "mock-id-" + Date.now(), name: newSpaceName, members: [user.email || user.uid], createdBy: user.uid, createdAt: Date.now() }]);
      setNewSpaceName('');
    }
  };

  const handleJoinSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinSpaceId.trim()) {
      navigate(`/space/${joinSpaceId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bölüşme Alanlarım</h1>
          <button
            onClick={() => { /* Logout logic */ navigate('/login'); }}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <LogOut className="mr-2" size={20} />
            Çıkış
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Yeni Alan Oluştur</h2>
            <form onSubmit={handleCreateSpace} className="flex gap-2">
              <input
                type="text"
                placeholder="Örn: Antalya Tatili"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="submit"
                className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PlusCircle className="mr-2" size={20} />
                Oluştur
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Mevcut Alana Katıl</h2>
            <form onSubmit={handleJoinSpace} className="flex gap-2">
              <input
                type="text"
                placeholder="Alan ID'sini girin"
                value={joinSpaceId}
                onChange={(e) => setJoinSpaceId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                Katıl
              </button>
            </form>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Yükleniyor...</div>
        ) : spaces.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">Henüz bir bölüşme alanınız yok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {spaces.map((space) => (
              <Link
                key={space.id}
                to={`/space/${space.id}`}
                className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-bold text-indigo-600 mb-2 truncate">{space.name}</h3>
                <p className="text-sm text-gray-500">
                  {space.members.length} Üye
                </p>
                <p className="text-xs text-gray-400 mt-4">
                  ID: {space.id} (Katılmak isteyenlere bu kodu verin)
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
