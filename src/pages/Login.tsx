import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, isMock } from '../firebase';
import { Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { User } from 'firebase/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ModeToggle } from '../components/mode-toggle';

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
    <div className="min-h-screen bg-background flex flex-col justify-center p-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4"><ModeToggle /></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="flex justify-center text-primary mb-6">
          <Wallet size={48} />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {mode === 'login' && 'Hesabınıza giriş yapın'}
              {mode === 'register' && 'Yeni hesap oluşturun'}
              {mode === 'guest' && 'Misafir olarak devam et'}
            </CardTitle>
            <CardDescription className="text-center">Splito ile masrafları kolayca bölüşün.</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex justify-center space-x-2 sm:space-x-4 mb-6 border-b border-border pb-4">
              <button
                onClick={() => setMode('login')}
                className={`text-sm font-medium ${mode === 'login' ? 'text-primary border-b-2 border-primary pb-1' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Giriş Yap
              </button>
              <button
                onClick={() => setMode('register')}
                className={`text-sm font-medium ${mode === 'register' ? 'text-primary border-b-2 border-primary pb-1' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Kayıt Ol
              </button>
              <button
                onClick={() => setMode('guest')}
                className={`text-sm font-medium ${mode === 'guest' ? 'text-primary border-b-2 border-primary pb-1' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Misafir
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && <div className="text-destructive text-sm text-center">{error}</div>}

              {mode === 'guest' ? (
                <div className="space-y-2">
                  <label htmlFor="guestName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Adınız (İsteğe bağlı)
                  </label>
                  <Input
                    id="guestName"
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Örn: Ahmet"
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      E-posta adresi
                    </label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Şifre
                    </label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full">
                {mode === 'login' && 'Giriş Yap'}
                {mode === 'register' && 'Kayıt Ol'}
                {mode === 'guest' && 'Misafir Girişi Yap'}
              </Button>
            </form>

            {mode !== 'guest' && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-card px-2 text-muted-foreground">Veya</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleLogin}
                    className="w-full"
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google ile Giriş Yap
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
