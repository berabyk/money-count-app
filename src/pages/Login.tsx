import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
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
  const { setMockUser } = useAuth();

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

  const handleGoogleLogin = async () => {
    if (isMock) {
      setMockUser({ uid: "google-mock", email: "google@example.com", displayName: "Google User" } as User);
      navigate('/');
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google login failed.');
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

          {mode !== 'guest' && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Veya</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleGoogleLogin}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google ile Giriş Yap
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
