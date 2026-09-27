import { NavLink, Outlet } from "react-router-dom";

// Navegação principal por barra inferior (seção 12).
// Configurações não aparece aqui — fica dentro de um menu (☰) na Home.
export default function MainLayout() {
  return (
    <div className="app-shell">
      <div className="app-content">
        <Outlet />
      </div>
      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          <span>🏠</span>
          <span>Início</span>
        </NavLink>
        <NavLink to="/atletas" className={({ isActive }) => (isActive ? "active" : "")}>
          <span>👥</span>
          <span>Atletas</span>
        </NavLink>
        <NavLink to="/partidas" className={({ isActive }) => (isActive ? "active" : "")}>
          <span>🏟️</span>
          <span>Partidas</span>
        </NavLink>
        <NavLink to="/estatisticas" className={({ isActive }) => (isActive ? "active" : "")}>
          <span>📊</span>
          <span>Estatísticas</span>
        </NavLink>
      </nav>
    </div>
  );
}
