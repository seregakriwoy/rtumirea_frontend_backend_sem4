import axios from "axios";

const apiClient = axios.create({
    baseURL: "http://localhost:3000/api",
    headers: {
        "Content-Type": "application/json",
        "accept": "application/json",
    }
});

// Функция для установки токена в заголовки
export const setApiToken = (token) => {
    if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete apiClient.defaults.headers.common['Authorization'];
    }
};

// Инициализируем токен при загрузке если он есть в localStorage
const token = localStorage.getItem('accessToken');
if (token) {
    setApiToken(token);
}

// Добавляем интерцептор к apiClient, а не к api
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Добавляем проверку на существование error
        if (!error) {
            return Promise.reject(new Error('Unknown error'));
        }
        
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
                
                // Обновляем заголовки для apiClient
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                
                // Повторяем оригинальный запрос с помощью apiClient
                return apiClient(originalRequest);
            } catch (refreshError) {
                // Если refresh токен невалидный, очищаем localStorage
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                delete apiClient.defaults.headers.common['Authorization'];
                
                // Не перенаправляем, а просто отклоняем ошибку
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

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
    updateGood: async (id, good) => {
        let response = await apiClient.patch(`/goods/${id}`, good);
        return response.data;
    },
    deleteGood: async (id) => {
        let response = await apiClient.delete(`/goods/${id}`);
        return response.data;
    }
}

export default api;