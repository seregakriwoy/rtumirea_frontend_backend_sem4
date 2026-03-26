import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LoginModal from './components/LoginModal.jsx';
import GoodsPage from './pages/UsersPage/GoodsPage.jsx';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return <div>Загрузка...</div>;
    }
    
    if (!user) {
        return <LoginModal />;
    }
    
    return children;
};

const AppContent = () => {
    const { user, logout } = useAuth();
    
    return (
        <div className="App">
            {user && (
                <header style={styles.header}>
                    <h1>Добро пожаловать, {user.username}!</h1>
                    <button onClick={logout} style={styles.logoutButton}>
                        Выйти
                    </button>
                </header>
            )}
            <Routes>
                <Route path="/" element={
                    <ProtectedRoute>
                        <GoodsPage />
                    </ProtectedRoute>
                } />
            </Routes>
        </div>
    );
};

const styles = {
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
    },
    logoutButton: {
        padding: '0.5rem 1rem',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    },
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppContent />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;