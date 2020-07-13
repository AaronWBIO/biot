import NotificationService from '../../services/notificaction';
import { UPDATE_NOTIFICATIONS_INDICATOR } from '../ActionTypes';

const updateNotificationsIndicator = () => {
    const action = (dispatch) => {
        NotificationService.getUserNumberOfNotificationForRead()
        .then(res => {
            if(res.status==200 || res.status == 201){
                let result = JSON.parse(res._bodyText); 
                dispatch({
                    type: UPDATE_NOTIFICATIONS_INDICATOR,
                    count: result
                });
            }         
        });
    };
    return action;
};
export {
    updateNotificationsIndicator
};