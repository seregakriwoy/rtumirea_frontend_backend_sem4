import axios from "axios";
const apiClient = axios.create({
    baseURL: "http://localhost:3000/api",
    headers: {
        "Content-Type": "application/json",
        "accept": "application/json",
    }
});
export const api = {
    createGood: async (good) => {
        let response = await apiClient.post("/goods", good);
        return response.data;
    },
    getGoods: async () => {
        let response = await apiClient.get("/goods");
        return response.data;
    },
    getGoodsById: async (id) => {
        let response = await apiClient.get(`/goods/${id}`);
        return response.data;
    },
    updateGoods: async (id, goods) => {
        let response = await apiClient.patch(`/goods/${id}`, good);
        return response.data;
    },
    deleteGood: async (id) => {
        let response = await apiClient.delete(`/goods/${id}`);
        return response.data;
    }
}