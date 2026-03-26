import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

const UsersModal = ({ isOpen, onClose }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingData, setEditingData] = useState({});
    const { user: currentUser } = useAuth();
    
    const apiClientRef = useRef(null);

    // Инициализируем apiClient один раз
    useEffect(() => {
        if (!apiClientRef.current) {
            const client = axios.create({
                baseURL: "http://localhost:3000/api"
            });

            client.interceptors.request.use(
                (config) => {
                    const token = localStorage.getItem('accessToken');
                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                    return config;
                },
                (error) => {
                    return Promise.reject(error);
                }
            );

            apiClientRef.current = client;
        }
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await apiClientRef.current.get('/users');
            setUsers(response.data);
        } catch (err) {
            console.error('Fetch users error:', err);
            setError(err.response?.data?.error || 'Ошибка при загрузке пользователей');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && currentUser?.role === 'admin' && apiClientRef.current) {
            fetchUsers();
        }
    }, [isOpen, currentUser]);

    const handleEdit = (user) => {
        setEditingId(user.id);
        setEditingData({
            username: user.username,
            role: user.role,
            isActive: String(user.isActive)
        });
    };

    const handleSave = async (id) => {
        try {
            const dataToSend = {
                username: editingData.username,
                role: editingData.role,
                isActive: editingData.isActive === 'true'
            };
            console.log('Sending PUT request to /users/' + id, dataToSend);
            await apiClientRef.current.put(`/users/${id}`, dataToSend);
            setEditingId(null);
            setEditingData({});
            fetchUsers();
        } catch (err) {
            console.error('Save user error:', err);
            setError(err.response?.data?.error || 'Ошибка при обновлении пользователя');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Вы уверены, что хотите заблокировать этого пользователя?')) {
            try {
                setError('');
                console.log('Sending DELETE request to /users/' + id);
                await apiClientRef.current.delete(`/users/${id}`);
                console.log('DELETE request successful');
                setError('');
                fetchUsers();
            } catch (err) {
                console.error('Delete user error:', err);
                const errorMsg = err.response?.data?.error || err.message || 'Ошибка при удалении пользователя';
                setError(errorMsg);
            }
        }
    };

    const handleUnblock = async (id) => {
        if (window.confirm('Вы уверены, что хотите разблокировать этого пользователя?')) {
            try {
                setError('');
                console.log('Sending PUT request to unblock /users/' + id);
                await apiClientRef.current.put(`/users/${id}`, { isActive: true });
                console.log('Unblock request successful');
                setError('');
                fetchUsers();
            } catch (err) {
                console.error('Unblock user error:', err);
                const errorMsg = err.response?.data?.error || err.message || 'Ошибка при разблокировке пользователя';
                setError(errorMsg);
            }
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditingData({});
    };

    if (!isOpen) return null;

    if (currentUser?.role !== 'admin') {
        return (
            <div style={styles.overlay}>
                <div style={styles.modal}>
                    <h2>Доступ запрещен</h2>
                    <p>Только администраторы могут управлять пользователями</p>
                    <button onClick={onClose} style={styles.closeButton}>Закрыть</button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h2>Управление пользователями</h2>
                    <button onClick={onClose} style={styles.closeBtn}>✕</button>
                </div>

                {error && <div style={styles.error}>{error}</div>}

                {loading ? (
                    <div style={styles.loading}>Загрузка...</div>
                ) : (
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Имя пользователя</th>
                                    <th>Роль</th>
                                    <th>Статус</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.id}</td>
                                        <td>
                                            {editingId === user.id ? (
                                                <input
                                                    type="text"
                                                    value={editingData.username}
                                                    onChange={(e) =>
                                                        setEditingData({
                                                            ...editingData,
                                                            username: e.target.value
                                                        })
                                                    }
                                                    style={styles.input}
                                                />
                                            ) : (
                                                user.username
                                            )}
                                        </td>
                                        <td>
                                            {editingId === user.id ? (
                                                <select
                                                    value={editingData.role}
                                                    onChange={(e) =>
                                                        setEditingData({
                                                            ...editingData,
                                                            role: e.target.value
                                                        })
                                                    }
                                                    style={styles.input}
                                                >
                                                    <option value="user">user</option>
                                                    <option value="seller">seller</option>
                                                    <option value="admin">admin</option>
                                                </select>
                                            ) : (
                                                user.role
                                            )}
                                        </td>
                                        <td>
                                            {editingId === user.id ? (
                                                <select
                                                    value={editingData.isActive}
                                                    onChange={(e) =>
                                                        setEditingData({
                                                            ...editingData,
                                                            isActive: e.target.value
                                                        })
                                                    }
                                                    style={styles.input}
                                                >
                                                    <option value="true">Активен</option>
                                                    <option value="false">Неактивен</option>
                                                </select>
                                            ) : (
                                                user.isActive ? 'Активен' : 'Неактивен'
                                            )}
                                        </td>
                                        <td style={styles.actions}>
                                            {editingId === user.id ? (
                                                <>
                                                    <button
                                                        onClick={() => handleSave(user.id)}
                                                        style={{ ...styles.button, ...styles.saveButton }}
                                                    >
                                                        Сохранить
                                                    </button>
                                                    <button
                                                        onClick={handleCancel}
                                                        style={{ ...styles.button, ...styles.cancelButton }}
                                                    >
                                                        Отмена
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        style={{ ...styles.button, ...styles.editButton }}
                                                    >
                                                        Редактировать
                                                    </button>
                                                    <button
                                                        onClick={() => user.isActive ? handleDelete(user.id) : handleUnblock(user.id)}
                                                        style={{ 
                                                            ...styles.button, 
                                                            ...(user.isActive ? styles.deleteButton : styles.unblockButton)
                                                        }}
                                                    >
                                                        {user.isActive ? 'Заблокировать' : 'Разблокировать'}
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div style={styles.footer}>
                    <button onClick={onClose} style={styles.closeButton}>
                        Закрыть
                    </button>
                </div>
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
        width: '95%',
        maxWidth: '1000px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        borderBottom: '1px solid #ddd',
        paddingBottom: '1rem',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        fontSize: '1.5rem',
        cursor: 'pointer',
        color: '#666',
    },
    tableContainer: {
        flex: 1,
        overflowY: 'auto',
        marginBottom: '1rem',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.9rem',
    },
    error: {
        color: 'red',
        marginBottom: '1rem',
        padding: '0.75rem',
        backgroundColor: '#ffebee',
        borderRadius: '4px',
    },
    loading: {
        textAlign: 'center',
        padding: '2rem',
        color: '#666',
    },
    input: {
        width: '100%',
        padding: '0.5rem',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '0.9rem',
    },
    actions: {
        display: 'flex',
        gap: '0.5rem',
    },
    button: {
        padding: '0.4rem 0.8rem',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.85rem',
        whiteSpace: 'nowrap',
    },
    editButton: {
        backgroundColor: '#007bff',
        color: 'white',
    },
    deleteButton: {
        backgroundColor: '#dc3545',
        color: 'white',
    },
    unblockButton: {
        backgroundColor: '#28a745',
        color: 'white',
    },
    saveButton: {
        backgroundColor: '#28a745',
        color: 'white',
    },
    cancelButton: {
        backgroundColor: '#6c757d',
        color: 'white',
    },
    footer: {
        textAlign: 'right',
        paddingTop: '1rem',
        borderTop: '1px solid #ddd',
    },
    closeButton: {
        padding: '0.75rem 1.5rem',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem',
    },
};

export default UsersModal;
