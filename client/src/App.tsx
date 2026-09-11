import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Fixtures from "./pages/Fixtures.tsx";
import MatchDetail from "./pages/MatchDetail.tsx";
import Team from "./pages/Team.tsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/fixtures" element={<Fixtures />} />
        <Route path="/match/:id" element={<MatchDetail />} />
        <Route path="/team/:id" element={<Team />} />
      </Route>
    </Routes>
  );
}
