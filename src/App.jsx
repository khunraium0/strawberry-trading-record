import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { SalesPage } from './pages/SalesPage';
import { CustomersPage } from './pages/CustomersPage';
import { ProductsPage } from './pages/ProductsPage';
import { ReportsPage } from './pages/ReportsPage';
import { Loader2 } from 'lucide-react';

export function App() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

  // Trigger modal opening across pages
  const [openPurchaseModal, setOpenPurchaseModal] = useState(false);
  const [openSaleModal, setOpenSaleModal] = useState(false);
  const [openCustomerModal, setOpenCustomerModal] = useState(false);
  const [openProductModal, setOpenProductModal] = useState(false);

  // Quick action from dashboard -> switch to page and open modal
  const handleQuickAddPurchase = () => {
    setActivePage('purchases');
    setOpenPurchaseModal(true);
  };

  const handleQuickAddSale = () => {
    setActivePage('sales');
    setOpenSaleModal(true);
  };

  const handleQuickAddCustomer = () => {
    setActivePage('customers');
    setOpenCustomerModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-600 text-white flex items-center justify-center text-3xl shadow-lg shadow-rose-200 animate-pulse mb-4">
          🍓
        </div>
        <p className="font-bold text-slate-800 text-base">Strawberry Trading Record</p>
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
          Loading secure business records...
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      {activePage === 'dashboard' && (
        <DashboardPage
          setActivePage={setActivePage}
          onOpenAddPurchase={handleQuickAddPurchase}
          onOpenAddSale={handleQuickAddSale}
          onOpenAddCustomer={handleQuickAddCustomer}
        />
      )}

      {activePage === 'purchases' && (
        <PurchasesPage
          isModalOpen={openPurchaseModal}
          setIsModalOpen={setOpenPurchaseModal}
        />
      )}

      {activePage === 'sales' && (
        <SalesPage
          isModalOpen={openSaleModal}
          setIsModalOpen={setOpenSaleModal}
        />
      )}

      {activePage === 'customers' && (
        <CustomersPage
          isModalOpen={openCustomerModal}
          setIsModalOpen={setOpenCustomerModal}
        />
      )}

      {activePage === 'products' && (
        <ProductsPage
          isModalOpen={openProductModal}
          setIsModalOpen={setOpenProductModal}
        />
      )}

      {activePage === 'reports' && <ReportsPage />}
    </Layout>
  );
}

export default App;
