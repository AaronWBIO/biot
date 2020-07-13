import AppConstants from '../config/constants';
import { store } from '../navigators/AppNavigator';

var ReportService = {
    addReport : async (reportEntity) => {
        const state = store.getState();
        var headers = new Headers();        
        headers.append("Authorization", "Bearer " + state.user.id_token);
        headers.append("Content-Type", "application/json");
        headers.append("Accept","application/json");
        return fetch(AppConstants.api.report.post, {method: 'POST', headers, body: JSON.stringify(reportEntity)});
    },
    getCurrentUserReports: async(pagination) => {
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        var urlParameters = Object.entries(pagination).map(e => e.join('=')).join('&');
        return fetch(AppConstants.api.report.get + '?' + urlParameters,{method: 'GET', headers});
    },
    getAllReportTags: async() => {
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        return fetch(AppConstants.api.report.getAllReportTags,{method: 'GET', headers});
    },
    getReport: async(id) => {
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        return fetch(AppConstants.api.report.getReport.replace("{id}",id),{method: 'GET', headers});
    },
    getUserContrib: async() => {
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        return fetch(AppConstants.api.report.getUserContrib,{method: 'GET', headers});
    },
    getEcoBenefitsBySingleId: async(id) => {
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        return fetch(AppConstants.api.report.getEcoBenefitsBySingleId.replace("{id}",id),{method: 'GET', headers});
    },
    getEcoBenefits: async(id) => {
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        return fetch(AppConstants.api.report.getEcoBenefits.replace("{id}",id),{method: 'GET', headers});
    },
    getUserSingleContrib: async() => {
        const state = store.getState();
        var headers = new Headers();
        const id_token = state.user.id_token;
        headers.append("Authorization", "Bearer " + id_token);
        headers.append("Content-Type", "application/json");
        return fetch(AppConstants.api.report.getUserSingleContrib,{method: 'GET', headers});
    },
}
export default ReportService;