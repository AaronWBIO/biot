import AppConstants from '../config/constants';
import { store } from '../navigators/AppNavigator';

var NotificationService = {
    getCurrentUserNotifications: async(pagination) => {
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        var urlParameters = Object.entries(pagination).map(e => e.join('=')).join('&');
        return fetch(AppConstants.api.notification.getCurrentUserNotifications + '?' + urlParameters,{method: 'GET', headers});
    },
    updateToken: async(token) => {
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        return fetch(AppConstants.api.notification.updateToken, {method: 'POST', headers, body: token});
    },
    updateLocation: async(wkt) => {
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        return fetch(AppConstants.api.notification.updateLocation, {method: 'POST', headers, body: wkt});
    },
    getUserNumberOfNotificationForRead: async() => {
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        return fetch(AppConstants.api.notification.getUserNumberOfNotificationForRead, {method: 'GET', headers});
    },
}
export default NotificationService;