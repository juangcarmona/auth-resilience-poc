import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './layout/AppShell';
import { WeatherPage } from './routes/WeatherPage';
import { UserDetailsPage } from './routes/UserDetailsPage';
import { LoginPage } from './routes/LoginPage';
import { AuthenticatedRoute } from './auth/AuthenticatedRoute';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <AuthenticatedRoute>
              <AppShell>
                <WeatherPage />
              </AppShell>
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <AuthenticatedRoute>
              <AppShell>
                <UserDetailsPage />
              </AppShell>
            </AuthenticatedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
