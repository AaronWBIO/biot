import AppConstants from '../config/constants';
import { store } from '../navigators/AppNavigator';

var ConfigService = {
  getConfig : async () => {
    var headers = new Headers();
    headers.append("Content-Type", "application/json");
    return fetch(AppConstants.api.config.general);
  },
  getConfigAssistant : async () => {
    const state = store.getState();
    var headers = new Headers();
    const id_token = state.user.id_token;
    headers.append("Authorization", "Bearer " + id_token);
    headers.append("Content-Type", "application/json");
    return fetch(AppConstants.api.config.assistant,{method: 'GET', headers});
  },
}
export default ConfigService;