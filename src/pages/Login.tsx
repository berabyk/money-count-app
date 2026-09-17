import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, updateProfile } from 'firebase/auth';
import { auth, isMock } from '../firebase';
import { Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { User } from 'firebase/auth';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [guestName, setGuestName] = useState('');
  const [mode, setMode] = useState<'login' | 'register' | 'guest'>('login');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setMockUser } = useAuth() as any; // We'll add this to context next

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isMock) {
      if (mode === 'guest' && guestName.trim()) {
        setMockUser({ uid: "guest-" + Date.now(), email: "", displayName: guestName.trim() } as User);
      } else {
        setMockUser({ uid: "mock-user-123", email: email || "mock@example.com", displayName: email.split('@')[0] || "Mock User" } as User);
      }
      navigate('/');
      return;
    }

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'register') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else if (mode === 'guest') {
        const userCredential = await signInAnonymously(auth);
        if (guestName.trim()) {
          await updateProfile(userCredential.user, { displayName: guestName.trim() });
        }
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-indigo-600">
          <Wallet size={48} />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {mode === 'login' && 'Hesabınıza giriş yapın'}
          {mode === 'register' && 'Yeni hesap oluşturun'}
          {mode === 'guest' && 'Misafir olarak devam et'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex justify-center space-x-4 mb-6 border-b pb-4">
            <button
              onClick={() => setMode('login')}
              className={`text-sm font-medium ${mode === 'login' ? 'text-indigo-600 border-b-2 border-indigo-600 pb-1' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Giriş Yap
            </button>
            <button
              onClick={() => setMode('register')}
              className={`text-sm font-medium ${mode === 'register' ? 'text-indigo-600 border-b-2 border-indigo-600 pb-1' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Kayıt Ol
            </button>
            <button
              onClick={() => setMode('guest')}
              className={`text-sm font-medium ${mode === 'guest' ? 'text-indigo-600 border-b-2 border-indigo-600 pb-1' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Misafir
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}

            {mode === 'guest' ? (
              <div>
                <label htmlFor="guestName" className="block text-sm font-medium text-gray-700">
                  Adınız (İsteğe bağlı)
                </label>
                <div className="mt-1">
                  <input
                    id="guestName"
                    name="guestName"
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Örn: Ahmet"
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    E-posta adresi
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Şifre
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {mode === 'login' && 'Giriş Yap'}
                {mode === 'register' && 'Kayıt Ol'}
                {mode === 'guest' && 'Misafir Girişi Yap'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
