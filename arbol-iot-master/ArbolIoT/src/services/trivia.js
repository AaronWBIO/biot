import AppConstants from '../config/constants';
import { store } from '../navigators/AppNavigator';

var TriviaService = {
    addTrivia : async (triviaEntity) => {
        const state = store.getState();
        var headers = new Headers();        
        headers.append("Authorization", "Bearer " + state.user.id_token);
        headers.append("Content-Type", "application/json");
        headers.append("Accept","application/json");
        return fetch(AppConstants.api.trivia.post, {method: 'POST', headers, body: JSON.stringify(triviaEntity)});
    },
    getTrivia: async() => {
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        var accountUrl = AppConstants.api.trivia.get;
        return fetch(accountUrl,{method: 'GET', headers});
    },
    validateQuestion : async (quid,qa) => {
        const state = store.getState();
        var headers = new Headers();
        headers.append("Authorization", "Bearer " + state.user.id_token);
        headers.append("Content-Type", "application/json");
        headers.append("Accept","application/json");
        return fetch(AppConstants.api.trivia.validateQuestion+ "?qid="+quid+"&qa="+qa, {method: 'POST', headers});
    },
}
export default TriviaService;