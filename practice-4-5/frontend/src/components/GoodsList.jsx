import React from "react";
import GoodItem from "./GoodItem";

export default function GoodsList({ goods, onEdit, onDelete }) {
    if (!goods.length) {
        return <div className="empty">Товаров пока нет</div>;
    }

    return (
        <div className="list">
            {goods.map((good) => (
                <GoodItem 
                    key={good.id} 
                    good={good} 
                    onEdit={onEdit} 
                    onDelete={onDelete} 
                />
            ))}
        </div>
    );
}