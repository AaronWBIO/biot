import AppConstants from '../config/constants';
import { store } from '../navigators/AppNavigator';

var MainService = {
  getLastMainData : async (id) => {
    const state = store.getState();
    var headers = new Headers();
    headers.append("Authorization", "Bearer " + state.user.id_token);
    headers.append("Content-Type", "application/json");
    return fetch(AppConstants.api.main.get.replace("{id}",id),{headers});
  },
}
export default MainService;