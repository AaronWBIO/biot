import MainService from '../../services/main';
import { SET_LAST_MAIN_DATA } from '../ActionTypes';

const setMainData = (id) => {
    const action = (dispatch) => {
        MainService.getLastMainData(id)
        .then((res) => res.json())
        .then(res => {
            var lastData = res;
            dispatch({
                type: SET_LAST_MAIN_DATA,
                lastData
            });
        })
        .catch((e) => {
        });
    };
    return action;
};
export {
    setMainData
};