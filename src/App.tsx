import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/services/authContext";
import MainLayout from "@/layouts/MainLayout";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Athletes from "@/pages/Athletes";
import Games from "@/pages/Games";
import NewGame from "@/pages/NewGame";
import Scout from "@/pages/Scout";
import Statistics from "@/pages/Statistics";
import Report from "@/pages/Report";

function RequireAuth({ children }: { children: JSX.Element }) {
  const { loading, authenticated } = useAuth();
  if (loading) return null;
  if (!authenticated) return <Navigate to="/login" replace />;
  return children;
}

function Routed() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/atletas" element={<Athletes />} />
        <Route path="/partidas" element={<Games />} />
        <Route path="/estatisticas" element={<Statistics />} />
      </Route>
      {/* Fora do MainLayout: telas que precisam de tela cheia (sem barra inferior) */}
      <Route
        path="/partidas/novo"
        element={
          <RequireAuth>
            <NewGame />
          </RequireAuth>
        }
      />
      <Route
        path="/partidas/:gameId/scout"
        element={
          <RequireAuth>
            <Scout />
          </RequireAuth>
        }
      />
      <Route
        path="/partidas/:gameId/relatorio"
        element={
          <RequireAuth>
            <Report />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routed />
    </AuthProvider>
  );
}
