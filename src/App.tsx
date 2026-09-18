import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './components/theme-provider';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Space } from './pages/Space';
import { MemberDetail } from './pages/MemberDetail';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/space/:id" element={<Space />} />
            <Route path="/space/:id/member/:memberName" element={<MemberDetail />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
