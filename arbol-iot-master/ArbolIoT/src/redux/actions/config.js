
import ConfigService from '../../services/config';
import { SET_CONFIG } from '../ActionTypes';

const setConfig = () => {
    const action = (dispatch) => {
        ConfigService.getConfig()
        .then((res) => res.json())
        .then(res => {
            var config = res;
            dispatch({
                type: SET_CONFIG,
                config
            });
        })
        .catch((e) => {
        });
    };
    return action;
};

const setConfigOnInit = (config) => {
    const action = (dispatch) => {
        dispatch({
            type: SET_CONFIG,
            config
        });
    };
    return action;
}

export {
    setConfig,
    setConfigOnInit
};