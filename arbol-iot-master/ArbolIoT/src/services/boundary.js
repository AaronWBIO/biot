import AppConstants from '../config/constants';
import { store } from '../navigators/AppNavigator';

var BoundaryService = {
  query : async (pagination) => {
    const state = store.getState();
    var headers = new Headers();
    headers.append("Authorization", "Bearer " + state.user.id_token);
    headers.append("Content-Type", "application/json");
    var urlParameters = Object.entries(pagination).map(e => e.join('=')).join('&');
    return fetch(AppConstants.api.boundary+ '?' + urlParameters,{method: 'GET', headers});
  },
  getFavorites : async () => {
    const state = store.getState();
    var headers = new Headers();
    headers.append("Authorization", "Bearer " + state.user.id_token);
    headers.append("Content-Type", "application/json");
    return fetch(AppConstants.api.boundaryFavorites,{headers});

  },
  addFavorite : async (boundary) => {
    const state = store.getState();
    const user = state.user.user;
    var fav = { boundary, user};
    var headers = new Headers();
    headers.append("Authorization", "Bearer " + state.user.id_token);
    headers.append("Content-Type", "application/json");
    return fetch(AppConstants.api.boundaryFavoritesAdd, {method: 'POST', headers, body: JSON.stringify(fav)});
  },
  deleteFavorite : async (id) => {
    const state = store.getState();
    var headers = new Headers();
    headers.append("Authorization", "Bearer " + state.user.id_token);
    headers.append("Content-Type", "application/json");
    return fetch(AppConstants.api.boundaryFavoritesDelete.replace("{id}",id), {method: 'DELETE', headers });
  },
  getBoundariesByTypeWithGeom : async (pagination) => {
    const state = store.getState();
    var headers = new Headers();
    headers.append("Authorization", "Bearer " + state.user.id_token);
    headers.append("Content-Type", "application/json");
    var urlParameters = Object.entries(pagination).map(e => e.join('=')).join('&');
    return fetch(AppConstants.api.boundaryWithGeom+ '?' + urlParameters,{method: 'GET', headers});
  }
}


export default BoundaryService;