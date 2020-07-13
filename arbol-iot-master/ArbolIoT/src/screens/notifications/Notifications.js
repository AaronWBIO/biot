import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import {
    View,
    StyleSheet,
    Text,
    SafeAreaView,
    TouchableOpacity,
    Image,
    FlatList,
    ActivityIndicator
} from 'react-native';
import { Card, CardItem, Icon, Body} from 'native-base';
import NotificationService from '../../services/notificaction';
import strings from '../../config/languages';
import globalStyles from '../../styles/global';
import Orientation from 'react-native-orientation';

class Notifications extends Component {
    static navigationOptions = ({ navigation }) => ({
        title: strings.notifications.title,
        headerLeft: <TouchableOpacity style={globalStyles.headerLeft} onPress={ () => { navigation.goBack() }}>
            <Icon name="ios-arrow-back" style={globalStyles.headerLeftIcon}/>
        </TouchableOpacity>,        
        headerRight: (<View />),
        headerTintColor: colors.white,
        headerStyle: globalStyles.headerStyle,
        headerTitleStyle: globalStyles.headerTitleStyle,
    });
    constructor(props) {
        super(props)
        this.state = {
            icons: {
                DEFAULT: require('../../resources/notifications/default.png'),
                ADD_TREE: require('../../resources/global/icon-tree-gen.png'),
                EDIT_TREE: require('../../resources/global/icon-tree-gen.png'),
                ADOPT_TREE: require('../../resources/global/icon-user-trees.png'),
                VALIDATE_TREE: require('../../resources/global/icon-tree-gen.png'),
                ADD_COMMUNITY_PUBLICATION: require('../../resources/main/icon-community.png'),
                ADD_COMMUNITY_COMMENT:  require('../../resources/main/icon-community.png'),
                ANSWER_QUESTION_CORRECTLY: require('../../resources/main/icon-trivia.png'),
                ADD_TRIVIA: require('../../resources/main/icon-trivia.png'),
                ADD_FRIEND: require('../../resources/global/icon-friends.png')
            },
            labels: {
                LOGIN: strings.notifications.LOGIN,
                VIEW_ON_BOARD: strings.notifications.VIEW_ON_BOARD,
                ADD_TREE: strings.notifications.ADD_TREE,
                EDIT_TREE: strings.notifications.EDIT_TREE,
                ADOPT_TREE: strings.notifications.ADOPT_TREE,
                VALIDATE_TREE: strings.notifications.VALIDATE_TREE,
                SKIP_ON_BOARD: strings.notifications.SKIP_ON_BOARD,
                UPDATE_PHOTO: strings.notifications.UPDATE_PHOTO,
                WATER_TREE: strings.notifications.WATER_TREE,
                ADD_COMMUNITY_PUBLICATION: strings.notifications.ADD_COMMUNITY_PUBLICATION,
                ADD_COMMUNITY_COMMENT: strings.notifications.ADD_COMMUNITY_COMMENT,
                ANSWER_QUESTION_CORRECTLY:strings.notifications.ANSWER_QUESTION_CORRECTLY,
                ADD_TRIVIA: strings.notifications.LOGIN,
                ADD_FRIEND: strings.notifications.ADD_FRIEND,
                ADD_REPORT: strings.notifications.ADD_REPORT,
                DEFAULT: strings.notifications.DEFAULT
            },
            notificationsData: [],
            moreElements: true,
            isLoading: false,
            page: 0,            
            size: 10,
            sort: 'id,desc'
        }
    }
    componentDidMount(){
        Orientation.lockToPortrait();
        this.loadNotifications();
        this.props.updateNotificationsIndicator();
    }
    loadNotifications = () => {
        this.setState({ isLoading: true})
        NotificationService.getCurrentUserNotifications({ page: this.state.page, size: this.state.size, sort: this.state.sort})
        .then((res) => {
            if(res.status==200 || res.status == 201){
                let result = JSON.parse(res._bodyText);
                if(result.length > 0){
                    this.setState({
                        notificationsData: this.state.page === 0 ? result : [...this.state.notificationsData, ...result], 
                        isLoading: false,                     
                    });
                } else{
                    this.setState({ moreElements: false, isLoading: false });
                }
            }         
        })
        .catch((e) => {
            this.setState({ isLoading: false});
        });
    }
    renderItem = ({item, key}) => {
        if (item.empty === true) {
            return <View key={item.id} style={[styles.item, styles.itemInvisible]} />;
        }   
        return (
            <View key={item.id} >
                <Card >
                    <CardItem style={{marginVertical: 10}}>                                                
                        <Body>
                            <View style={{flexDirection:'row', width:'100%', }}>
                                <View style={{flexDirection:'row', justifyContent:'flex-start', alignItems:'center', width:'50%', marginBottom: 10,}}>
                                    <Image source={this.state.icons[item.subType] != undefined ?  this.state.icons[item.subType] : this.state.icons['DEFAULT'] } style={{height: 25, width: 25, resizeMode: 'contain' }} />
                                    {item.subType &&
                                        <Text style={{color:'#9b9b9b', fontSize: 13, fontWeight: '400', marginLeft: 10 }}>{this.state.labels[item.subType] != undefined ?  this.state.labels[item.subType] : this.state.icons['DEFAULT'] }</Text>
                                    }
                                </View >
                                { item.readableDate &&
                                    <View style={{ width: '50%', alignItems: 'flex-end', marginBottom: 5,}}>
                                        <Text style={{color:'#2ca06c', fontSize: 12, fontWeight: '700', }}>{ item.readableDate}</Text>
                                    </View>
                                }
                            </View>
                            { item.title &&
                                <Text style={{color:'#5b5b5b', fontSize: 14, fontWeight: '500', marginBottom: 5, }}>{item.title}</Text>
                            }
                            { item.text &&
                                <Text style={{color:'#9b9b9b', fontSize: 14, fontWeight: '400', lineHeight:25}}>{item.text}</Text>
                            }
                        </Body>
                    </CardItem>
                </Card>
            </View>
        );
    }
    handleLoadMore = () => {
        if(this.state.moreElements){
            this.setState( state => ({page: state.page + 1}), () => this.loadNotifications());
        }
    };
    emptyList = ({}) => {
        if (this.state.isLoading)
            return <View></View>;
        else
            return (<View style={{ alignItems: 'center', marginTop: 30}}>
                        <Text style={globalStyles.text}>{ strings.notifications.emptyList }</Text>
                    </View>);
    }
    renderFooter = () => {
        return  ( this.state.isLoading ? 
                    <View style={styles.loader}> 
                        <ActivityIndicator color='#2CA06C' size='large' />
                    </View> : null);
    }
    render() {
        return (
            <SafeAreaView  style={ styles.wrapper }>
                <FlatList
                    extraData={this.state}
                    data={this.state.notificationsData}                          
                    keyExtractor={(item, index) => item.id+''}                   
                    renderItem= {this.renderItem }
                    onEndReached={() => this.handleLoadMore()}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={this.emptyList} 
                    ListFooterComponent={this.renderFooter}
                    style={{ marginVertical:10, paddingHorizontal: 20}}
                /> 
            </SafeAreaView>
        )
    }
}
const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    item: {
        alignSelf: 'center',
        justifyContent: 'center',
        flex: 1,
        marginTop: 15,
        marginBottom: 15,
        alignSelf: 'baseline',
    },
    itemInvisible: {
        backgroundColor: 'transparent',
    },
    loader:{
        marginTop: 20,
        alignItems: 'center'
    },
});
const mapStateToProps = (state) => {
    return {
        idToken: state.user.id_token,
        loggedInStatus: state.loggedInStatus
    }
}
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Notifications);