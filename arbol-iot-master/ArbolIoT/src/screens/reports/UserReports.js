import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import {
    Platform,
    StyleSheet,
    Text,
    SafeAreaView,
    Image,
    TouchableOpacity,
    View,
    FlatList,
    ActivityIndicator
} from 'react-native';
import { Badge, ListItem, Left, Body, Right, Icon, Button } from 'native-base';
import strings from '../../config/languages';
import ReportService from '../../services/report';
import _ from 'lodash';
import constants from '../../config/constants';
import ImageWithAuth from '../../components/image';
import globalStyles from '../../styles/global';
import {Linking} from 'react-native'

class UserReports extends Component {
    static navigationOptions = ({ navigation}) => ({
        title: strings.userReports.title,
        headerLeft: <TouchableOpacity style={globalStyles.headerLeft} onPress={ () => { navigation.goBack() }}>
                        <Icon name="ios-arrow-back" style={globalStyles.headerLeftIcon}/>
                    </TouchableOpacity>,        
        headerRight: <View></View>,             
        headerTintColor: colors.white,
        headerStyle: globalStyles.headerStyle,
        headerTitleStyle: globalStyles.headerTitleStyle,
    });    
    constructor(props) {
        super(props)
        this.state = {
            enabled: false,
            plainBody: '',
            phone: '',
            userMaxReportCreation: 1,
            userReportCreated: 0,
            isLoading: false,
            moreElements: true,
            loadingImage: false,
            page: 0,
            pageSize: 10, 
            sort: 'id,desc',
            reportsData: []
        }  
    }
    async componentDidMount() {
        if(this.props.reportModule != undefined && this.props.reportModule.enabled != undefined && 
           this.props.reportModule.enabled != false) {
            this.setState({enabled:true, plainBody: '', phone: '' });
            this._loadReports(0);
            this.subs = [ 
                this.props.navigation.addListener ('willFocus', () => {this._loadReports(1);})
            ];
        } else{
            this.setState({enabled:false, plainBody: this.props.reportModule.message, phone: this.props.reportModule.phone });
        }
    }
    componentWillUnmount() {
        if(this.props.reportModule != undefined && this.props.reportModule.enabled != undefined && 
            this.props.reportModule.enabled != false) {
            this.subs.forEach((sub) => {
            sub.remove();
            });
        }
    }
    _loadReports(type){
        let page = this.state.page;
        let moreElements = this.state.moreElements;
        if(type == 1){
            page = 0;
            moreElements = true
        }
        this.setState({ page: page, isLoading: true, moreElements: moreElements})
        ReportService.getCurrentUserReports({ page: page, size: this.state.pageSize, sort: this.state.sort })
        .then((res) => res.json())
        .then(res  => { 
            if (res.length > 0 ) {
                    if(page == 0){
                        this.setState({ reportsData: res});
                    } else {
                        this.setState(state => ({ reportsData: [...state.reportsData, ...res], isLoading: false}));
                    }
                    
            } else { 
                this.setState({ isLoading: false, moreElements: false,});
            } 
        }).catch((e) => {
            this.setState({ isLoading: false});
        });
    }
    handleLoadMore = () => {
        if(this.state.moreElements){
            this.setState( state => ({page: state.page + 1}), () => this._loadReports());
        }
    };
    renderItem = ({ item, index }) => {
        if (item.empty === true ) {
            return <View key={item.id} style={[styles.item, styles.itemInvisible]} />;
        }
        return (            
            <View key={item.id} style={ styles.item }>
                <ListItem thumbnail style={ { marginLeft: 0, borderBottomColor: "#d2d3d2", borderBottomWidth: 1, paddingBottom: 10, paddingTop: 10}}>
                    <TouchableOpacity onPress={() => this.props.navigation.navigate('ReportDetailView',{ id: item.id, mode:'view' }) } style={{ width:'100%', flexDirection: 'row'}}>
                        <Left style={{paddingLeft:30, paddingTop:15}}>
                            { item.image ?
                                <ImageWithAuth                                     
                                    style={{ height: 80, width: 80, marginBottom: 15, borderWidth:1, borderColor:'#f7f7f7'}} 
                                    source={{ uri: constants.base + item.image.uri }} 
                                /> :
                                <Image source={require('../../resources/global/default-tree-img.png')}  style={{ height: 80, width: 80, marginBottom: 15, borderWidth:1, borderColor:'#f7f7f7'}}   />
                            }
                        </Left> 
                        <Body style={{ borderBottomWidth: 0 }}>
                            <Text style={styles.itemTitle}>{item.title}</Text>
                            <Text style={styles.itemDateLabel}>{strings.userReports.publishDate} </Text>  
                            { item.readableDate ? <Text style={styles.itemDate}>{item.readableDate}</Text>:<Text></Text>}
                            {   item.status == "open" ?  
                                <Badge style={[ styles.badge, {backgroundColor:'#F7AE55'}]}> 
                                    <Text style={styles.badgeText}>{strings.userReports.open}</Text>
                                </Badge> 
                                :
                                <Badge style={[ styles.badge, {backgroundColor:'#ea585e'}]}> 
                                    <Text style={styles.badgeText}>{strings.userReports.close}</Text>
                                </Badge>
                            }
                        </Body>
                        <Right style={{ borderBottomWidth: 0, paddingRight:30}}>                            
                            <Icon name="ios-arrow-forward" style={ [{  fontSize:25, color:"#737373",  height: 25, width: 10, alignSelf:'center'}]}/>               
                        </Right>
                    </TouchableOpacity> 
                </ListItem>
            </View>
        );
    };
    emptyList = ({}) => {
        if (this.state.isLoading)
            return <View></View>;
        else
            return (<View style={{ alignItems: 'center', marginTop: 30}}>
                        <Text style={{color:'#5b5b5b'}}>{strings.userReports.emptyList}</Text>
                    </View>);
    }
    renderFooter = () => {
        return  ( this.state.isLoading ? 
                    <View style={styles.loader}> 
                        <ActivityIndicator color='#2CA06C' size='large' />
                    </View> : null);
    }
    render() {
        const { goBack } = this.props.navigation;
            return (
                <SafeAreaView style={ styles.wrapper}>
                    { this.state.enabled ? 
                    <View style={{flex:1}}>
                        <View>
                            <FlatList
                            style={{ width: '100%' }}
                            keyExtractor={(item, index) => index + ''}
                            data={this.state.reportsData}
                            onEndReached={() => this.handleLoadMore()}
                            onEndReachedThreshold={0.5}
                            renderItem={this.renderItem}                        
                            ListEmptyComponent={this.emptyList}
                            ListFooterComponent={this.renderFooter}
                            />
                        </View>
                        <View style={{position: 'absolute', flex: 1, justifyContent: 'flex-end', right: 25, bottom:20, alignItems:'center'}}>
                            <TouchableOpacity onPress={() => this.props.navigation.navigate("ReportForm") } style={{ justifyContent: 'center', alignItems:'center'}}>
                                <View style={{backgroundColor:"#EA585E", width:50, height:50, borderRadius:50,margin:5  }}>
                                    <Image source={require('../../resources/global/icon-edit.png')} style={{ width:25, height:25, resizeMode:'contain', justifyContent:'center', alignSelf:'center', flex:1}}/>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                    :
                    <View style={{width:'100%', height:200}}>
                        <Text style={[globalStyles.text,{width:300, margin:20, textAlign:'center', alignSelf:'center'}]}>{this.state.plainBody }</Text>
                        <View style={[ styles.buttonContainer, {position:'absolute', bottom:10, alignSelf:'center'}]}>
                                <Button block style={ styles.continueButton } onPress={() => {
                                            let phoneNumber = '';
                                            if (Platform.OS === 'android') { phoneNumber = `tel:${this.state.phone}`; }
                                            else {phoneNumber = `telprompt:${this.state.phone}`; }
                                            Linking.openURL(phoneNumber);
                                    }}>
                                    <Text style= { styles.continueLabel }><Icon name="ios-call" style={{ fontSize:20, color:'white'}}/> {' ' + this.state.phone }</Text>
                                </Button>
                        </View>
                    </View> 
                    }
                </SafeAreaView>
            )   
    }
}
const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent:'center'
    },
    badge: {
        marginTop:5,
        paddingLeft:5,
        paddingRight:5,
        height:20,
        justifyContent:'center',
        textAlign:'center'
    },
    badgeText:{
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
        paddingLeft:2,
        paddingRight:2
    },
    item: {        
        flex: 1,
    },
    itemTitle: {
        fontSize:14,
        fontWeight: '700',
        color:"#5b5b5b",
        paddingBottom: 3,
    },
    itemDateLabel: {
        fontSize:12,
        fontWeight: '400',
        color:"#5b5b5b",
        paddingBottom: 3,
    },
    itemDate:{
        fontSize:11,
        fontWeight: '600',
        color:"#5b5b5b",
        paddingBottom: 3,
    },
    itemInvisible: {
        backgroundColor: 'transparent',
    },
    loader:{
        marginTop: 20,
        alignItems: 'center'
    },
    buttonContainer: {
        marginLeft: 60,
        marginRight: 60,
        marginTop: 10,
        marginBottom: 20,  
        padding:0,
        justifyContent:'center',
        alignItems: 'center',
        height:60
    },
    continueButton: {
        backgroundColor:'#41B07C', 
        borderRadius: 5,
        justifyContent:'center',
        alignItems: 'center',
    },
    continueLabel: {
        fontWeight:'bold',
        color: 'white',
        textAlign: 'center',
        alignSelf: 'center',
        justifyContent:'center',
        alignItems: 'center',
        marginHorizontal:50
    },
});
 
const mapStateToProps = (state) => {
    return {
        param: state.param,
        idToken: state.user.id_token,
        loggedInStatus: state.loggedInStatus,
        reportModule: state.config.application.dynamic.reportModule,
    }
}

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}


export default connect(mapStateToProps, mapDispatchToProps)(UserReports);
