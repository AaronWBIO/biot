import AppConstants from '../config/constants';
import { store } from '../navigators/AppNavigator';

var OnBoardService = {
    getOnBoard: async(id) => {
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        var onBoardGetUrl = AppConstants.api.onBoard.get.replace("{id}",id);
        return fetch(onBoardGetUrl,{method: 'GET', headers});
    },
    markAsReaded: async(id) => {
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        var onBoardGetUrl = AppConstants.api.onBoard.mark.replace("{id}",id);
        return fetch(onBoardGetUrl,{method: 'POST', headers});
    },
    markAsReadedWithSkip: async(id) => {
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        var onBoardGetUrl = AppConstants.api.onBoard.mark.replace("{id}",id);
        return fetch(onBoardGetUrl + '?skip=true',{method: 'POST', headers});
    },

}
export default OnBoardService;