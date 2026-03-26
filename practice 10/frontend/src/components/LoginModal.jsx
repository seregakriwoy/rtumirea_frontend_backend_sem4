import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const LoginModal = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = isLogin 
            ? await login(username, password)
            : await register(username, password);

        if (!result.success) {
            setError(result.error);
            setLoading(false);
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h2>{isLogin ? 'Вход' : 'Регистрация'}</h2>
                <form onSubmit={handleSubmit}>
                    <div style={styles.inputGroup}>
                        <label>Имя пользователя</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={styles.input}
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label>Пароль</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={styles.input}
                        />
                    </div>
                    {error && <div style={styles.error}>{error}</div>}
                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
                    </button>
                </form>
                <button
                    onClick={() => {
                        setIsLogin(!isLogin);
                        setError('');
                    }}
                    style={styles.switchButton}
                >
                    {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
                </button>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        width: '400px',
        maxWidth: '90%',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    },
    inputGroup: {
        marginBottom: '1rem',
    },
    input: {
        width: '100%',
        padding: '0.5rem',
        marginTop: '0.25rem',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '1rem',
    },
    button: {
        width: '100%',
        padding: '0.75rem',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '1rem',
        cursor: 'pointer',
        marginTop: '1rem',
    },
    switchButton: {
        width: '100%',
        padding: '0.5rem',
        backgroundColor: 'transparent',
        color: '#007bff',
        border: 'none',
        cursor: 'pointer',
        marginTop: '1rem',
    },
    error: {
        color: 'red',
        marginBottom: '1rem',
        fontSize: '0.875rem',
    },
};

export default LoginModal;