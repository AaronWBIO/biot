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
} from 'react-native';
import { Col, Grid, Row } from "react-native-easy-grid";
import { Button } from 'native-base';
import strings from '../../config/languages';
import _ from 'lodash';
import constants from '../../config/constants';
import ImageWithAuth from '../../components/image';
import globalStyles from '../../styles/global';
import OnBoardService from '../../services/onboard';
import AwesomeAlertPlus from '../../components/awesome-alert/AwesomeAlertPlus';
import GeneralHelpers from '../../helpers/GeneralHelpers';
import GamificationAlert from '../../components/awesome-alert/GamificationAlert';
import {StackActions,NavigationActions } from 'react-navigation';


class OnBoard extends Component {

    static navigationOptions = ({navigation}) => {
        const {params = {}} = navigation.state;
        return {
            headerTintColor: colors.white,
            header: 
            <SafeAreaView style={ [ { backgroundColor: 'white'}, Platform.OS == "android" ? { height:60} : {}] }>
                <Grid >
                    <Col style={{ width:60,height: 60, justifyContent: "center", alignItems: "center" }}>
                    </Col>
                    <Col>
                    </Col>
                    <Col style={{ width:60,height: 60, justifyContent: "center", alignItems: "center" }}>
                        <TouchableOpacity onPress={()=>{ 
                            params.leaveOnBoard();   
                        }} style={{ width:60,height: 60, justifyContent: "center", alignItems: "center" }}>
                            <Text style={ globalStyles.text }>{ strings.onBoard.skip }</Text>
                        </TouchableOpacity>
                    </Col>
                </Grid>
            </SafeAreaView>
        }
    };
    constructor(props) {
        super(props)
        this.state = {
            id: this.props.navigation.getParam('id', null),
            isLoading: false,
            currentSlide: 0,
            slides: [],
            graphCounter: 0,
            showErrorAlert: false,
            alertErrorText: '',
            showSuccessAlert: false,
            showSuccessAlertWC: false,
            alertSuccessText: '',
            close: true,
            backFunc: () => {},
            gamificationAlertGeneralText: '',
            eventResponseVM: {},
            showExitAlert: false
        }  
        this.props.navigation.setParams({
            leaveOnBoard: this.leaveOnBoard.bind(this),
        });
    }
    leaveOnBoard() {
        this.setState({showExitAlert:true});
    }
    leave() {
        OnBoardService.markAsReadedWithSkip(this.state.id).then((res) => res.json())
        .then(res  => {
            this.props.navigation
            .dispatch(StackActions.reset(
                {
                    index: 0,
                    actions: [
                    NavigationActions.navigate({ routeName: 'Main' })
                    ]
            })); 
        }).catch((f) => {
            this.props.navigation
            .dispatch(StackActions.reset(
                {
                    index: 0,
                    actions: [
                    NavigationActions.navigate({ routeName: 'Main' })
                    ]
            })); 
        });
    }
    continue() {
        this.setState({showExitAlert:false});
    }
    async componentDidMount() {
        OnBoardService.getOnBoard(this.state.id).then(res => { 
            if(res.status == 200) {
                let entity = JSON.parse(res._bodyText);
                let payload = JSON.parse(entity.payload);
                if (payload.slides == undefined || payload.slides.length == 0) {
                    this.props.navigation
                    .dispatch(StackActions.reset(
                        {
                            index: 0,
                            actions: [
                            NavigationActions.navigate({ routeName: 'Main' })
                            ]
                    }));    
                } else {
                    this.setState({slides: payload.slides})
                }
            } else {
                this.props.navigation
                .dispatch(StackActions.reset(
                    {
                        index: 0,
                        actions: [
                        NavigationActions.navigate({ routeName: 'Main' })
                        ]
                }));    
            }
        });
    }
    next() {
        if (this.state.currentSlide + 1 < this.state.slides.length) {
            this.setState({currentSlide: this.state.currentSlide + 1});
        } else {
            this.setState({isLoading:true});
            OnBoardService.markAsReaded(this.state.id).then((res) => res.json())
            .then(res  => {
                if (_.has(res,"alter")) {
                    if (res.alter == true) {
                        this.setState({ 
                            close: true,
                            backFunc: () => {
                                this.props.navigation
                                .dispatch(StackActions.reset(
                                    {
                                        index: 0,
                                        actions: [
                                        NavigationActions.navigate({ routeName: 'Main' })
                                        ]
                                }));    
                            },
                            gamificationAlertGeneralText: strings.onBoard.points,
                            eventResponseVM:res});
                    } else {
                        this.setState({showSuccessAlert:true, alertSuccessText:strings.onBoard.points});
                    }
                } else {
                    this.setState({ showErrorAlert: true, alertErrorText: strings.general.error });
                    this.setState({isLoading:false});
                }
            }).catch((f) => {
                this.setState({ showErrorAlert: true, alertErrorText: strings.general.error });
                this.setState({isLoading:false});
            });
        }
    }
    back() {
        var index = this.state.currentSlide - 1 > 0 ? this.state.currentSlide - 1 : 0;
        this.setState({currentSlide:index});
    }
    render() {
        const { goBack } = this.props.navigation;
            return (
                <SafeAreaView style={ styles.wrapper}>
                    { this.state.slides != undefined && this.state.slides.length > 0 &&
                        <Grid>
                            <Row style={{ flexDirection:'column', justifyContent:'center'}}>
                                <ImageWithAuth 
                                    style={[globalStyles.alertImg , { width:120, height:120}]}
                                    source={{ uri: constants.base + this.state.slides[this.state.currentSlide].minio.uri }}
                                ></ImageWithAuth>
                                <Text style={[ globalStyles.alertTitleMain, { width:'80%', alignSelf:'center', fontSize:24, marginTop:40}] }>{ this.state.slides[this.state.currentSlide].label }</Text>
                                <Text style={[ globalStyles.alertText, { width:'80%', alignSelf:'center'}]}>{ this.state.slides[this.state.currentSlide].description }</Text>
                            </Row>
                            <Row style={{ flexDirection:'column', height:200}}>
                                <View style={{flexDirection:'row', alignSelf:'center'}}>
                                    {
                                        this.state.slides.map((slide,key) => {
                                            return <View key={key} style={[{margin:3, width:10, height:10, borderRadius:10, backgroundColor: key == this.state.currentSlide ? colors.mainColor : '#D8D8D8'}]}></View>
                                        })
                                    }
                                </View>
                                { !this.state.isLoading &&
                                <View>
                                    <View style={[styles.buttonContainer, { marginTop:30 }]}>
                                        <Button block success style={ styles.continueButton } onPress={() => this.next() }>
                                            <Text style= { styles.continueLabel }>{ strings.onBoard.next }</Text>
                                        </Button>
                                    </View>
                                    { this.state.currentSlide > 0 &&
                                    <View style={styles.buttonContainer}>
                                        <Button block transparent style={ styles.backButton }  onPress={() => this.back() }>
                                            <Text style= { styles.backLabel }>{ strings.backLabel }</Text>
                                        </Button>
                                    </View>
                                    }
                                </View>
                                }
                            </Row>
                        </Grid>

                    }
                    { /* Error alert */}
                    <AwesomeAlertPlus
                        show={ this.state.showErrorAlert }
                        {  ...GeneralHelpers.alertTemplateDefault }
                        onConfirmPressed={ () => { this.setState({showErrorAlert:false})}}
                        onDismiss={ () => { this.setState({showErrorAlert:false})}}
                        customView = { <View style={globalStyles.alertContainer}>
                                            <Image source={require('../../resources/global/icon-remove.png')} style={ globalStyles.alertImg}/>                             
                                            <Text style={globalStyles.alertTitle}> { strings.alertSorry } </Text>       
                                            <Text style={globalStyles.alertText}> { this.state.alertErrorText }  </Text>
                                        </View> 
                                        }
                    />    
                    { /* Success alert */}
                    <AwesomeAlertPlus
                        show={ this.state.showSuccessAlert }
                        {  ...GeneralHelpers.alertTemplateDefault }
                        onConfirmPressed={ () => { 
                            this.setState({showSuccessAlert:false});
                            this.props.navigation
                            .dispatch(StackActions.reset(
                                {
                                    index: 0,
                                    actions: [
                                    NavigationActions.navigate({ routeName: 'Main' })
                                    ]
                            }));    
                        }}
                        onDismiss={ () => { 
                            this.setState({showSuccessAlert:false});
                            this.props.navigation
                            .dispatch(StackActions.reset(
                                {
                                    index: 0,
                                    actions: [
                                    NavigationActions.navigate({ routeName: 'Main' })
                                    ]
                            }));    
                        }}
                        customView = { <View style={globalStyles.alertContainer}>
                                            <Image source={require('../../resources/global/icon-check.png')} style={ globalStyles.alertImg}/>                             
                                            <Text style={globalStyles.alertText}> { this.state.alertSuccessText }  </Text>
                                        </View> 
                                        }
                    />   
                   { /* Gamification alert */}
                    <GamificationAlert 
                        close = {true}
                        backFunc = { this.state.backFunc }
                        generalText = { this.state.gamificationAlertGeneralText }
                        eventResponseVM ={ this.state.eventResponseVM } />
                    <AwesomeAlertPlus
                    show={ this.state.showExitAlert }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    showConfirmButton={false}
                    customView = {  <View style={ [globalStyles.alertContainer, {width:300, marginVertical:10, marginHorizontal:0}] }>
                                        <Image source={require('../../resources/global/icon-remove.png')} style={ globalStyles.alertImg}/>            
                                        <Text style={ globalStyles.alertTitleMain }> {strings.leaveOnBoard} </Text>                 
                                        <Text style={ [globalStyles.alertText, {lineHeight:20}] }> {strings.leaveOnBoardMsg} </Text>
                                        <View style={{ marginTop: 20}}>
                                            <Button  style={[styles.retryButton,]} onPress={ () => this.continue()} >
                                                <Text style={styles.next}> {strings.continueLabelOnBoard}</Text>
                                            </Button>
                                            <Button transparent style={styles.exitButton} onPress={ () => { this.leave()} } >
                                                <Text style={[styles.next, {color:'#737373'}]}> {strings.leaveLabel}</Text>
                                            </Button>
                                        </View>
                                    </View>
                                }
                    />  
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
    buttonContainer: {
        marginLeft: 60,
        marginRight: 60,
        marginTop: 10,
        marginBottom: 0,  
        padding:0,
        justifyContent:'center',
        alignItems: 'center',
        height:50
    },
    continueButton: {
        backgroundColor:'#41B07C', 
        borderRadius: 5,
        justifyContent:'center',
        alignItems: 'center',
        marginTop:10,

    },
    continueLabel: {
        fontWeight:'bold',
        color: 'white',
        textAlign: 'center',
        alignSelf: 'center',
        justifyContent:'center',
        alignItems: 'center',
        width: '80%',
    },
    backLabel: {
        color: '#737373',
        textAlign: 'center',
        alignSelf: 'center',
        justifyContent:'center',
        alignItems: 'center',
        width: '80%',
    },
    backButton: {
        justifyContent:'center',
        alignItems: 'center',
        marginTop:0
    },
    retryButton: {
        backgroundColor:'#41B07C', 
        borderRadius: 5,
        alignSelf: 'center',
        marginBottom: 10,
        width: '100%',
        textAlign:'center',
        justifyContent:'center'
    },
    exitButton: {
        backgroundColor:'transparent', 
        borderRadius: 5,
        alignSelf: 'center',
        marginBottom: 10,
        width: '100%', 
        textAlign:'center',
        justifyContent:'center'
    },
    next: {
        fontWeight:'bold',
        color: 'white',
        textAlign:'center'
    },
});
const mapStateToProps = (state) => {
    return {
        idToken: state.user.id_token,
    }
}
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}
export default connect(mapStateToProps, mapDispatchToProps)(OnBoard);
