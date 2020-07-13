import AppConstants from '../config/constants';
import { store } from '../navigators/AppNavigator';
import RNFetchBlob from 'rn-fetch-blob';

var AdoptionService = {
    getAdoptionStatus : async(tid) => {
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        return fetch(AppConstants.api.adoption.getAdoptionStatus.replace("{tid}",tid),{method: 'GET', headers});
    },
    getCurrentUserTrees: async(pagination) => {
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        var urlParameters = Object.entries(pagination).map(e => e.join('=')).join('&');
        return fetch(AppConstants.api.adoption.getCurrentUserTrees+ '?' + urlParameters,{method: 'GET', headers});
    },
    treeAdopt: async(tid) => {
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        return fetch(AppConstants.api.adoption.treeAdopt.replace("{tid}",tid),{method: 'PUT', headers});
    },    
    treeUpdatePhoto : async (id, filename, data, type) => {
        const state = store.getState();
        return RNFetchBlob.fetch('PUT', AppConstants.api.adoption.treeUpdatePhoto.replace("{tid}",id), {
          'Authorization' : "Bearer " + state.user.id_token,
          'Content-Type' : 'multipart/form-data',
        }, [ { name : 'file', filename, data, type }]);
    },
    treeWatering: async(tid) => {
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        return fetch(AppConstants.api.adoption.treeWatering.replace("{tid}",tid),{method: 'PUT', headers});
    },
}
export default AdoptionService;