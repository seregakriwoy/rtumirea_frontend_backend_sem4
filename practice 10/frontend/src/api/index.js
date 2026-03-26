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

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Проверяем, что error.response существует и статус 401
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                
                // Если нет refresh токена, просто отклоняем ошибку
                if (!refreshToken) {
                    return Promise.reject(error);
                }
                
                const response = await axios.post('http://localhost:3000/api/auth/refresh', { refreshToken });
                const { accessToken, refreshToken: newRefreshToken } = response.data;
                
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', newRefreshToken);
                
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                
                return api(originalRequest);
            } catch (refreshError) {
                // Если refresh токен невалидный, очищаем localStorage
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                delete api.defaults.headers.common['Authorization'];
                
                // Не перенаправляем, а просто отклоняем ошибку
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;