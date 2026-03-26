import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LoginModal from './components/LoginModal.jsx';
import UsersModal from './components/UsersModal.jsx';
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
    const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
    
    return (
        <div className="App">
            {user && (
                <header style={styles.header}>
                    <h1>Добро пожаловать, {user.username}!</h1>
                    <div style={styles.headerActions}>
                        {user.role === 'admin' && (
                            <button 
                                onClick={() => setIsUsersModalOpen(true)} 
                                style={styles.usersButton}
                            >
                                Управление пользователями
                            </button>
                        )}
                        <button onClick={logout} style={styles.logoutButton}>
                            Выйти
                        </button>
                    </div>
                </header>
            )}
            <UsersModal 
                isOpen={isUsersModalOpen} 
                onClose={() => setIsUsersModalOpen(false)} 
            />
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
    headerActions: {
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
    },
    usersButton: {
        padding: '0.5rem 1rem',
        backgroundColor: '#17a2b8',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
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