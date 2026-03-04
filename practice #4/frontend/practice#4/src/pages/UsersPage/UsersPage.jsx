import React, { useMemo, useState } from "react";
import "./UsersPage.css";
import UsersList from "../../components/UsersList";
import UserModal from "../../components/UserModal";
export default function UsersPage() {
    const [users, setUsers] = useState([
        { id: 1, name: "Петр", age: 16 },
        { id: 2, name: "Иван", age: 18 },
        { id: 3, name: "Дарья", age: 20 },
    ]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
    const [editingUser, setEditingUser] = useState(null);
    const nextId = useMemo(() => {
        const maxId = users.reduce((m, u) => Math.max(m, u.id), 0);
        return maxId + 1;
    }, [users]);
    const openCreate = () => {
        setModalMode("create");
        setEditingUser(null);
        setModalOpen(true);
    };
    const openEdit = (user) => {
        setModalMode("edit");
        setEditingUser(user);
        setModalOpen(true);
    };
    const closeModal = () => {
        setModalOpen(false);
        setEditingUser(null);
    };
    const handleDelete = (id) => {
        const ok = window.confirm("Удалить пользователя?");
        if (!ok) return;
        setUsers((prev) => prev.filter((u) => u.id !== id));
    };
    const handleSubmitModal = (payload) => {
        if (modalMode === "create") {
            setUsers((prev) => [...prev, {
                id: nextId, name: payload.name,
                age: payload.age
            }]);
        } else {
            setUsers((prev) =>
                prev.map((u) => (u.id === payload.id ? {
                    ...u, name:
                        payload.name, age: payload.age
                } : u))
            );
        }
        closeModal();
    };
    return (
        <div className="page">
            <header className="header">
                <div className="header__inner">
                    <div className="brand">Users App</div>
                    <div className="header__right">React</div>
                </div>
            </header>
            <main className="main">
                <div className="container">
                    <div className="toolbar">
                        <h1 className="title">Пользователи</h1>
                        <button className="btn btn--primary" onClick=
                            {openCreate}>
                            + Создать
                        </button>
                    </div>
                    <UsersList users={users} onEdit={openEdit} onDelete=
                        {handleDelete} />
                </div>
            </main>
            <footer className="footer">
                <div className="footer__inner">© {new Date().getFullYear()}
                    Users App</div>
            </footer>
            <UserModal
                open={modalOpen}
                mode={modalMode}
                initialUser={editingUser}
                onClose={closeModal}
                onSubmit={handleSubmitModal}
            />
        </div>
    );
}