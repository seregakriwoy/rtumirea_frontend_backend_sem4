import React from "react";
export default function GoodItem({ good, onEdit, onDelete }) {
    return (
        <div className="goodRow">
            <div className="goodMain">
                <div className="goodId">#{good.id}</div>
                <div className="goodName">{good.name}</div>
                <div className="goodCategory">{good.category}</div>
                <div className="goodCategory">{good.discription}</div>
                <div className="goodCost">{good.cost}</div>
                <div className="goodCategory">{good.amount_in_storage}</div>
            </div>
            <div className="goodActions">
                <button className="btn" onClick={() => onEdit(good)}>
                    Редактировать
                </button>
                <button className="btn btn--danger" onClick={() =>
                    onDelete(good.id)}>
                    Удалить
                </button>
            </div>
        </div>
    );
}
