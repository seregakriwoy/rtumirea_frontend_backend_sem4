import React, { useEffect, useState } from "react";
import "./GoodsPage.scss";
import GoodsList from "../../components/GoodsList";
import GoodModal from "../../components/GoodModal";
import { api } from "../../api";

export default function GoodsPage() {
    const [goods, setGoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create"); // create | edit
    const [editingGood, setEditingGood] = useState(null);

    useEffect(() => {
        loadGoods();  
    }, []);

    const loadGoods = async () => {
        try {
            setLoading(true);
            const data = await api.getGoods(); // предполагаем такой метод
            setGoods(data);
        } catch (err) {
            console.error(err);
            alert("Ошибка загрузки товаров");
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setModalMode("create");
        setEditingGood(null);
        setModalOpen(true);
    };

    const openEdit = (good) => {
        setModalMode("edit");
        setEditingGood(good);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingGood(null);
    };

    const handleDelete = async (id) => {
        const ok = window.confirm("Удалить товар?");
        if (!ok) return;

        try {
            await api.deleteGood(id); // предполагаем такой метод
            setGoods((prev) => prev.filter((g) => g.id !== id));
        } catch (err) {
            console.error(err);
            alert("Ошибка удаления товара");
        }
    };

    const handleSubmitModal = async (payload) => {
        try {
            if (modalMode === "create") {
                const newGood = await api.createGood(payload); // предполагаем такой метод
                setGoods((prev) => [...prev, newGood]);
            } else {
                const updatedGood = await api.updateGood(payload.id, payload); // предполагаем такой метод
                setGoods((prev) =>
                    prev.map((g) => (g.id === payload.id ? updatedGood : g))
                );
            }
            closeModal();
        } catch (err) {
            console.error(err);
            alert("Ошибка сохранения товара");
        }
    };

    return (
        <div className="page">
            <header className="header">
                <div className="header__inner">
                    <div className="brand">Goods App</div>
                    <div className="header__right">React</div>
                </div>
            </header>

            <main className="main">
                <div className="container">
                    <div className="toolbar">
                        <h1 className="title">Товары</h1>
                        <button 
                            className="btn btn--primary" 
                            onClick={openCreate}
                        >
                            + Создать
                        </button>
                    </div>

                    {loading ? (
                        <div className="empty">Загрузка...</div>
                    ) : (
                        <GoodsList
                            goods={goods}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                        />
                    )}
                </div>
            </main>

            <footer className="footer">
                <div className="footer__inner">
                    © {new Date().getFullYear()} Goods App
                </div>
            </footer>

            <GoodModal 
                open={modalOpen}
                mode={modalMode}
                initialGood={editingGood}
                onClose={closeModal}
                onSubmit={handleSubmitModal}
            />
        </div>
    );
}