import React, { useEffect, useState } from "react";

export default function GoodModal({ open, mode, initialGood, onClose, onSubmit }) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [cost, setCost] = useState("");
    const [amount, setAmount] = useState("");

    useEffect(() => {
        if (!open) return;
        
        setName(initialGood?.name ?? "");
        setCategory(initialGood?.category ?? "");
        setDescription(initialGood?.discription ?? "");
        setCost(initialGood?.cost != null ? String(initialGood.cost) : "");
        setAmount(initialGood?.amount_in_storage != null ? String(initialGood.amount_in_storage) : "");
    }, [open, initialGood]);

    if (!open) return null;

    const title = mode === "edit" ? "Редактирование товара" : "Создание товара";

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const trimmedName = name.trim();
        const trimmedCategory = category.trim();
        const trimmedDescription = description.trim();
        const parsedCost = Number(cost);
        const parsedAmount = Number(amount);

        if (!trimmedName) {
            alert("Введите название товара");
            return;
        }
        
        if (!trimmedCategory) {
            alert("Введите категорию товара");
            return;
        }
        
        if (!Number.isFinite(parsedCost) || parsedCost < 0) {
            alert("Введите корректную стоимость");
            return;
        }
        
        if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
            alert("Введите корректное количество");
            return;
        }

        onSubmit({
            id: initialGood?.id, // если есть id - редактирование, если нет - создание
            name: trimmedName,
            category: trimmedCategory,
            discription: trimmedDescription,
            cost: parsedCost,
            amount_in_storage: parsedAmount
        });
    };

    return (
        <div className="backdrop" onMouseDown={onClose}>
            <div 
                className="modal" 
                onMouseDown={(e) => e.stopPropagation()}
                role="dialog" 
                aria-modal="true"
            >
                <div className="modal__header">
                    <div className="modal__title">{title}</div>
                    <button 
                        className="iconBtn" 
                        onClick={onClose} 
                        aria-label="Закрыть"
                    >
                        ✕
                    </button>
                </div>
                
                <form className="form" onSubmit={handleSubmit}>
                    <label className="label">
                        Название товара
                        <input
                            className="input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Например, Колбаса"
                            autoFocus
                        />
                    </label>

                    <label className="label">
                        Категория
                        <input
                            className="input"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Например, Еда"
                        />
                    </label>

                    <label className="label">
                        Описание
                        <textarea
                            className="input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Описание товара"
                            rows="3"
                        />
                    </label>

                    <label className="label">
                        Стоимость
                        <input
                            className="input"
                            value={cost}
                            onChange={(e) => setCost(e.target.value)}
                            placeholder="Например, 300"
                            inputMode="numeric"
                        />
                    </label>

                    <label className="label">
                        Количество на складе
                        <input
                            className="input"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Например, 1"
                            inputMode="numeric"
                        />
                    </label>

                    <div className="modal__footer">
                        <button type="button" className="btn" onClick={onClose}>
                            Отмена
                        </button>
                        <button type="submit" className="btn btn--primary">
                            {mode === "edit" ? "Сохранить" : "Создать"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}