import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import { Col, Row } from "react-native-easy-grid";
import {
    StyleSheet,
    Text,
    SafeAreaView,
    ScrollView,
    Image,
    TouchableOpacity,
    View,
} from 'react-native';
import { Body, Card, CardItem, Icon } from 'native-base';
import strings from '../../config/languages';
import ProgressCircle from 'react-native-progress-circle';
import ReportService from '../../services/report';
import _ from 'lodash';
import ImageWithAuth from '../../components/image';
import AppConstants from '../../config/constants';
import globalStyles from '../../styles/global';
import Loader from '../../components/loader/Loader';
import Orientation from 'react-native-orientation';

class UserContribution extends Component {
    static navigationOptions = ({ navigation}) => ({
        title: strings.userContribution.title,
        headerLeft: <TouchableOpacity style={globalStyles.headerLeft} onPress={ () => { navigation.goBack() }}>
            <Icon name="ios-arrow-back" style={globalStyles.headerLeftIcon}/>
        </TouchableOpacity>,        
        headerRight: (<View />),
        headerTintColor: colors.white,
        headerStyle: globalStyles.headerStyle,
        headerTitleStyle: globalStyles.headerTitleStyle,
    });    
    deviceLocale = 'es';    
    constructor(props) {
        super(props)
        this.state = {      
            contrib: 0,
            activities: [],
            isLoading: false,
            contributionData: [],            
            adoptedTrees: 0,
            addedTrees: 0,
            editedTrees: 0,
            mainStats:[],
            subStats:[],
        }  
    }
    componentDidMount(){
        Orientation.lockToPortrait();
        this.loadData();
    }
    loadData(){
        this.setState({ isLoading: true})
        ReportService.getUserContrib()
        .then((res) => {
            if(res.status==200 || res.status == 201){
                let result = JSON.parse(res._bodyText);
                this.setState({
                    contributionData: result,
                    isLoading: false,                     
                }, () => this.mappingData());
                
                this.setState({ isLoading: false });
            }         
        })
        .catch((e) => {
            this.setState({ isLoading: false});
        });
    }
    mappingData(){
        let d = this.state.contributionData;
        if (_.has(d,'activities'))
            this.state.activities= d.activities;
        if (_.has(d,'baseIndicators')){
            if (_.has(d,'baseIndicators.contrib'))
                this.state.contrib = d.baseIndicators.contrib;
            if (_.has(d,'baseIndicators.adoptedTrees'))
                this.state.adoptedTrees = d.baseIndicators.adoptedTrees;
            if (_.has(d,'baseIndicators.addedTrees'))
                this.state.addedTrees = d.baseIndicators.addedTrees;
            if (_.has(d,'baseIndicators.editedTrees'))
                this.state.editedTrees = d.baseIndicators.editedTrees;
        }
        if (_.has(d,'mainStats') && d.mainStats.length > 0 )
            this.state.mainStats = d.mainStats;
        if (_.has(d,'subStats') && d.subStats.length > 0 )
            this.state.subStats = d.subStats;
    }
    getFace(){
        if(this.state.contrib <= 33){
            return require('../../resources/user-contribution/icon-face-sad.png');;
        } else {
            if(this.state.contrib <= 66){
                return require('../../resources/user-contribution/icon-face-neutral.png');                
            } else {
                return require('../../resources/user-contribution/icon-face-happy.png');
            }
        }
    } 
    getActivities(){
        return this.state.activities.map(function(activitie, i){
            return(
                <View key={i} style={{flexDirection: 'row', paddingTop: 10, paddingBottom: 10, width:200,}}>
                    <Image source={require('../../resources/user-contribution/icon-check-blue.png')} style={[styles.iconArrow]}/>
                    <Text style={{ fontWeight: '400', fontSize: 14, color: '#828382', marginLeft:10, textAlign:'left'}}>{activitie}</Text>
                </View>
            );
        });
    }
    getMainStats(){
        return this.state.mainStats.map(function(item, i){
            return(
                <Row key={i} style={
                    (i) ? 
                        styles.noLineMain                        
                        :
                        styles.lineMain    
                    }>
                    <Col size={20}>
                        <ImageWithAuth source={{uri: AppConstants.base + item.imageUrl}} style={{ height: 45, width: 45, resizeMode:'contain', alignSelf: 'center'}} />
                    </Col>
                    <Col size={80}>
                    { item.fragments &&
                        <Text>                 
                            {item.fragments.map((b,i )=> <Text key={i} style={[{ color: b.color, fontSize: b.size, lineHeight:24}, b.color=='green' ? { fontWeight:'bold'} : {}]}>{b.text}</Text>)}
                        </Text>
                    }    
                    </Col>                
                </Row>
            );
        });
    }
    render() {
        return ( 
            <SafeAreaView style={{flex:1}}>
                { !this.state.isLoading &&
                <ScrollView>
                    <View style={styles.content} >
                        <Card style={{marginTop:20}}>
                            <CardItem >
                                <Body>
                                    <View style={{ alignItems:'center', marginVertical: 30, }}> 
                                        <ProgressCircle percent={this.state.contrib} radius={55} borderWidth={13} color="#1986C8" shadowColor="#E8F1F6" bgColor="#fff" >
                                            <View style={{flex:1, justifyContent: 'center'}}>                                                
                                                <Image source={this.getFace()} style={{ width: 51, height: 40, resizeMode:'contain'}}/>                                                
                                            </View>
                                        </ProgressCircle>
                                        <Text style={{fontSize:16, color:'#696767', fontWeight: '900', marginTop: 20, marginBottom: 20,}}>{this.state.contrib} <Text style={{fontSize:12, color:'#696767', fontWeight: '400'}}>/100</Text></Text>                                
                                        <Text style={{fontSize:14, color:'#646465', fontWeight: '400', textAlign: 'center', marginBottom: 20, lineHeight:24}}>
                                            { strings.userContribution.mainMessage.replace("{n}",this.state.contrib)}
                                        </Text>
                                        <View>
                                            { this.state.activities &&
                                            <View>
                                                <Text style={{fontSize:14, color:'#4a4a4a', fontWeight: '700', textAlign: 'center', marginBottom: 20,}}> { strings.userContribution.activities}</Text>
                                                <View style={{alignSelf:'center'}}>
                                                    { this.getActivities()}
                                                </View>
                                            </View>
                                            }                                            
                                        </View>
                                    </View>       
                                </Body>
                            </CardItem>
                        </Card>                                                         
                        <View style={{marginVertical:20}}>
                            { this.state.mainStats && 
                                this.getMainStats()
                            }
                        </View>                
                    </View>
                    <View style={{backgroundColor:'#f6f6f9'}}>
                        <View style={styles.content} >
                            <View style={{alignItems: 'center', marginBottom: 20,}}>
                                <Text style={{marginTop: 20, marginBottom: 15, fontSize: 17, fontWeight:'500', color:'#646465'}}>Mis árboles</Text>
                                <Row style={{alignItems: 'baseline', textAlign:'center'}}>
                                    <Col style={{padding: 10,}}>
                                        <Text style={{alignSelf: 'center', fontSize: 20, fontWeight: '700', color: '#2CA06C'}}> {this.state.addedTrees} </Text>
                                        <Text style={{textAlign: 'center', color:'#828382', padding:5}}>árboles capturados</Text>
                                    </Col>
                                    <Col style={{padding: 10, }}>
                                        <Text style={{alignSelf: 'center', fontSize: 20, fontWeight: '700', color: '#646465'}}> {this.state.editedTrees} </Text>
                                        <Text style={{textAlign: 'center', color:'#828382', padding:5}}>árboles editados</Text>
                                    </Col>
                                    <Col style={{padding: 10, }}>
                                        <Text style={{alignSelf: 'center', fontSize: 20, fontWeight: '700', color: '#646465'}}> {this.state.adoptedTrees} </Text>
                                        <Text style={{textAlign: 'center', color:'#828382', padding:5}}>árboles adoptados</Text>
                                    </Col>
                                </Row>
                            </View>
                        </View>
                    </View>
                    <View style={styles.dataContainer}>
                            { this.state.subStats &&
                                this.state.subStats.map(function(item, i){
                                    return( <View key={i} >
                                            <Row style={[styles.benefitsRows] } >
                                                <Col size={25} style={{alignItems: 'center',}}>
                                                    <View style={[styles.backFigure]}>
                                                        <ImageWithAuth source={{uri: AppConstants.base + item.imageUrl}} style={{ height: 35, width: 35, resizeMode: 'contain',}}/>
                                                    </View>
                                                </Col>
                                                <Col size={75} style={{flexDirection: 'column'}}>
                                                        <Text>{item.title.map((b,i )=> <Text key={i} style={[{ color: b.color, fontSize: b.size, lineHeight:24}, b.color=='green' ? { fontWeight:'bold'} : {}]}>{[b.text.trim(), ' ']}</Text>)}</Text>
                                                        <Text style={{color: item.description.color, fontSize:item.description.size, lineHeight:24}}>{item.description.text}</Text>
                                                </Col>
                                            </Row>
                                        </View> 
                                    )
                                })
                            }
                    </View>
                </ScrollView>  
                }
                { this.state.isLoading && <Loader></Loader> }
            </SafeAreaView>
        )  
    }
}

const styles = StyleSheet.create({
    noLineMain:{
        flexDirection:'row', 
        paddingTop: 15, 
        paddingBottom: 15,
        marginHorizontal:10,
    },
    dataContainer: {
        backgroundColor: '#fff',
        marginLeft: 15,
        marginRight: 15,
    },
    lineMain:{
        flexDirection:'row', 
        paddingTop: 15, 
        paddingBottom: 15, 
        marginHorizontal:10,
        borderBottomColor:'#e1dede', 
        borderBottomWidth:1
    },
    content:{ 
        marginLeft: 17,
        marginRight: 17,
    },
    benefitsRows: {
        flexDirection: 'row', 
        alignItems: 'center',
        paddingTop: 20, 
        paddingBottom: 20, 
        borderBottomColor: 'grey', 
        borderBottomWidth: 0.5,
    },
    iconArrow:{
        height: 14,
        width: 14,
        resizeMode: 'contain',
    },
    backFigure: {
        backgroundColor: 'white', 
        height: 65, 
        width: 65, 
        borderRadius: 33, 
        justifyContent: 'center',
        alignItems:'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderBottomWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 1,
        marginLeft: 5,
        marginRight: 5,
        marginTop: 10,
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
export default connect(mapStateToProps, mapDispatchToProps)(UserContribution);