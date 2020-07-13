import AppConstants from '../config/constants';
import { store } from '../navigators/AppNavigator';

var SpeciesService = {
  getAll : async () => {
    const state = store.getState();
    var headers = new Headers();
    headers.append("Authorization", "Bearer " + state.user.id_token);
    headers.append("Content-Type", "application/json");
    return fetch(AppConstants.api.species + "?page=0&size=5000",{headers});
  },
}
export default SpeciesService;