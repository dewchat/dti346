const API_BASE_URL = 'http://localhost:5001/api';

// Helper function to make API calls
const apiCall = async (endpoint, options = {}) => {
    // Get user from localStorage for auth
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Only add X-User-Id if user exists and has id
    if (user && user.id) {
        headers['X-User-Id'] = String(user.id);
    }

    const config = {
        ...options,
        mode: 'cors',
        headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
    }

    return data;
};

// Auth APIs
export const authAPI = {
    login: (username, password) =>
        apiCall('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        }),

    logout: () =>
        apiCall('/logout', { method: 'POST' }),

    checkAuth: () =>
        apiCall('/check-auth'),
};

// Restaurant APIs
export const restaurantAPI = {
    getAll: () =>
        apiCall('/restaurants'),

    getById: (id) =>
        apiCall(`/restaurants/${id}`),

    create: (data) =>
        apiCall('/restaurants', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};

// Menu APIs
export const menuAPI = {
    getByRestaurant: (restaurantId) =>
        apiCall(`/restaurants/${restaurantId}/menu`),

    addItem: (restaurantId, data) =>
        apiCall(`/restaurants/${restaurantId}/menu`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};

// Cart APIs
export const cartAPI = {
    get: () =>
        apiCall('/cart'),

    add: (menuItemId, quantity = 1, note = '') =>
        apiCall('/cart', {
            method: 'POST',
            body: JSON.stringify({ menu_item_id: menuItemId, quantity, note }),
        }),

    update: (itemId, data) =>
        apiCall(`/cart/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    remove: (itemId) =>
        apiCall(`/cart/${itemId}`, { method: 'DELETE' }),

    clear: () =>
        apiCall('/cart/clear', { method: 'DELETE' }),
};

// Order APIs
export const orderAPI = {
    create: () =>
        apiCall('/orders', { method: 'POST' }),

    getHistory: () =>
        apiCall('/orders/history'),

    getById: (orderId) =>
        apiCall(`/orders/${orderId}`),

    updateStatus: (orderId, status) =>
        apiCall(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        }),

    getRestaurantOrders: (restaurantId) =>
        apiCall(`/restaurants/${restaurantId}/orders`),
};

// Message APIs
export const messageAPI = {
    get: (orderId) =>
        apiCall(`/messages/${orderId}`),

    send: (orderId, content) =>
        apiCall(`/messages/${orderId}`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        }),

    // Restaurant chat (pre-order)
    getRestaurantChat: (restaurantId) =>
        apiCall(`/restaurants/${restaurantId}/chat`),

    sendRestaurantChat: (restaurantId, content, receiverId = null) =>
        apiCall(`/restaurants/${restaurantId}/chat`, {
            method: 'POST',
            body: JSON.stringify({ content, receiver_id: receiverId }),
        }),

    getRestaurantConversations: (restaurantId) =>
        apiCall(`/restaurants/${restaurantId}/conversations`),
};

// User APIs
export const userAPI = {
    getProfile: () =>
        apiCall('/user/profile'),

    updateProfile: (data) =>
        apiCall('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
};

export default {
    auth: authAPI,
    restaurant: restaurantAPI,
    menu: menuAPI,
    cart: cartAPI,
    order: orderAPI,
    message: messageAPI,
    user: userAPI,
};
