import AppConstants from '../config/constants';
import { store } from '../navigators/AppNavigator';

var CommunityService = {

    getAllCommunityTags: async() => {
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        return fetch(AppConstants.api.community.getAllCommunityTags,{method: 'GET', headers});
    },

    postPublication : async (CommunityEntity) => {
        const state = store.getState();
        var headers = new Headers();        
        headers.append("Authorization", "Bearer " + state.user.id_token);
        headers.append("Content-Type", "application/json");
        headers.append("Accept","application/json");
        return fetch(AppConstants.api.community.post, {method: 'POST', headers, body: JSON.stringify(CommunityEntity)});
    },

    queryPublications : async(pagination) => {
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        var urlParameters = Object.entries(pagination).map(e => e.join('=')).join('&');
        return fetch(AppConstants.api.community.queryPublications + '?' + urlParameters,{method: 'GET', headers});
    },
    toggleStatus : async(id) =>{
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        return fetch(AppConstants.api.community.toggleStatus.replace("{id}",id),{method: 'POST', headers});
    },
    toggleLike : async(id) =>{
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        return fetch(AppConstants.api.community.toggleLike.replace("{id}",id),{method: 'POST', headers});
    },
    toggleSticky : async(id) =>{
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        return fetch(AppConstants.api.community.toggleSticky.replace("{id}",id),{method: 'POST', headers});
    },
    getCommunityPublication : async(id) =>{
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        return fetch(AppConstants.api.community.getCommunityPublication.replace("{id}",id),{method: 'GET', headers});
    },
    getPublicationComments: async(id) =>{
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        return fetch(AppConstants.api.community.getPublicationComments.replace("{id}",id),{method: 'GET', headers});
    },
    createEntityRelatedData : async (CommunityEntity) => {
        const state = store.getState();
        var headers = new Headers();        
        headers.append("Authorization", "Bearer " + state.user.id_token);
        headers.append("Content-Type", "application/json");
        headers.append("Accept","application/json");
        return fetch(AppConstants.api.entityRelated.createEntityRelatedData, {method: 'POST', headers, body: JSON.stringify(CommunityEntity)});
    },
    postComment : async (Comment) => {
        const state = store.getState();
        var headers = new Headers();        
        headers.append("Authorization", "Bearer " + state.user.id_token);
        headers.append("Content-Type", "application/json");
        headers.append("Accept","application/json");
        return fetch(AppConstants.api.community.postComment.replace("{id}",Comment.id) + "?body="+ Comment.body,{method: 'POST', headers});
    },

}
export default CommunityService;