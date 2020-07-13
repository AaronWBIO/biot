import AppConstants from '../config/constants';
import { store } from '../navigators/AppNavigator';

var AchievementsService = {
    getProfileAchievementsByType: async(type,pagination) => {
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        var urlParameters = Object.entries(pagination).map(e => e.join('=')).join('&');
        return fetch(AppConstants.api.achievement.getProfileAchievementsByType.replace('{type}', type) + '?' + urlParameters,{method: 'GET', headers});
    },
}
export default AchievementsService;