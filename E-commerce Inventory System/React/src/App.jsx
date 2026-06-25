import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Analytics from './pages/Analytics';
import LowStock from './pages/LowStock';
import Categories from './pages/Categories';
import ComingSoon from './pages/ComingSoon';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/customers" element={<ComingSoon title="Customers" note="No /Customers endpoint exists on the backend yet — this page can't be built until one is added." />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/low-stock" element={<LowStock />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}