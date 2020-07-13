import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import { StyleSheet, Text, SafeAreaView, ScrollView, Image, TouchableOpacity, View, } from 'react-native';
import { Card, CardItem, Body, Left, Button, Icon } from 'native-base'; 
import strings from '../../config/languages';
import AwesomeAlertPlus from '../../components/awesome-alert/AwesomeAlertPlus';
import TriviaService from '../../services/trivia';
import _ from 'lodash';
import Loader from '../../components/loader/Loader';
import constants from '../../config/constants';
import GamificationAlert from '../../components/awesome-alert/GamificationAlert';
import ImageWithAuth from '../../components/image';
import GeneralHelpers from '../../helpers/GeneralHelpers';
import globalStyles from '../../styles/global';

class TriviaAnswer extends Component {
    static navigationOptions = ({navigation}) => {
        const {params = {}} = navigation.state;
        return {
            title:params.title || 'Trivia', 
            headerLeft: <TouchableOpacity style={globalStyles.headerLeft} 
                    onPress={ () => { 
                        if (params.customBack !== undefined) {
                            params.customBack();
                        }
                    }}>
                    <Icon name="ios-arrow-back" style={globalStyles.headerLeftIcon}/>
                </TouchableOpacity>,        
            headerRight: (<View />),
            headerTintColor: colors.white,
            headerStyle: globalStyles.headerStyle,
            headerTitleStyle: globalStyles.headerTitleStyle,
        }
    };
    constructor(props) {
        super(props)
        this.state = {
            backFunc: () => {},
            qid: null,
            qa: null,
            gamificationAlertGeneralText: '',
            eventResponseVM: {},
            showAlertRetry: false,
            showAlertCancel: false,
            showAlertValidate: false,
            questions: [],
            serverResponses: [],
            maxQuestion: 5,
            questionNumber: 1,
            isLoading: false,
            points: 0,
            choose: '',
            countCorrect: 0,
            correctAnswer: '',           
        }
        this.state.questions =  this.props.navigation.getParam('questions', []);
        this.state.maxQuestion = this.state.questions.length;
    }
    componentDidMount() {
        this.customTitle(1);
        this.props.navigation.setParams({
            customBack: this.customBack.bind(this),
        });
    }
    _validate = (qid,qa) => {    
        this.setState({qid, qa});
        if(this.state.choose == '') {
            TriviaService.validateQuestion(qid,qa)
            .then((res) => res.json())
            .then(res  => {                
                if (_.has(res,"original")) {
                    var result =  res.original;
                    var correct = this.state.countCorrect;
                    var isValid = result.correctAnswer;
                    var  correctAnswer = result.triviaQuestion.correctAnswer
                    if(isValid){
                        correct = correct + 1 ;
                        this.calculatePoints(res.points)
                    }
                    res.correct = correct;
                    this.state.serverResponses.push(res); 
                    this.setState({
                        choose: qa,
                        countCorrect: correct,
                        correctAnswer: correctAnswer,
                        isLoading: false,
                    });
                } else { 
                    this.setState({showAlertRetry:true, isLoading:true});
                }
            }).catch((e) => {
                this.setState({showAlertRetry:true, isLoading:true});
            });
        }
    } 
    customBack(){
        if(this.state.serverResponses.length >= 0){
            this.setState({
                showAlertCancel:true
            });
        } else {
            this.props.navigation.goBack();
        }        
    } 
    customTitle(c){
        if (c == 1) {
            let title = strings.triviaCreateForm.question + ' ' + this.state.questionNumber +''+ strings.triviaCreateForm.the +''+ this.state.maxQuestion;
            this.props.navigation.setParams({
                title: title, 
            });             
        } else {
            let x = this.state.questionNumber + 1;
            let title = strings.triviaCreateForm.question + ' ' + x +''+ strings.triviaCreateForm.the +''+ this.state.maxQuestion;
            this.props.navigation.setParams({
                title: title, 
            });             
        }
    }
    exitAlert = () => {
        this.setState({ showAlertRetry: false });
        this.props.navigation.navigate('Trivia');
    }
    retryAlert =() => {
        this.setState({showAlertRetry:false, isLoading:true});
        setTimeout(()=>{
            this._validate(this.state.qid, this.state.qa);     
        },1000);
    }
    calculatePoints(points){
        this.setState({
            points : this.state.points + points
        })
    }
    alertPoints(){
        if(this.state.serverResponses.length > 0 && this.state.points > 0) {
            this.setState({isLoading:true});
            var lastResponse = this.state.serverResponses.pop();
            lastResponse.alter = true;
            while(this.state.serverResponses.length > 0) {
                var nextElement = this.state.serverResponses.pop();
                lastResponse.achievements = lastResponse.achievements.concat(nextElement.achievements);
                lastResponse.points = nextElement.points + lastResponse.points;
                if(_.has(nextElement,'profile.id')){
                    lastResponse.profile = nextElement.profile;
                }
            } 
            setTimeout(() => {
                this.setState({ 
                    close: true,
                    backFunc: () => { this.props.navigation.goBack() },
                    gamificationAlertGeneralText: this.state.countCorrect + (this.state.countCorrect > 1 ? strings.triviaAnswer.goodAnswers : strings.triviaAnswer.goodAnswer ),
                    eventResponseVM:lastResponse});
            },100)
        } else{
            this.setState({showAlertValidate:true});
        }
    }
    _onPressButton = () => {
        if(this.state.choose != ''){ 
            this.refs._scrollView.scrollTo({ x:1, y:1}); 
            if(this.state.questionNumber < this.state.maxQuestion){
                this.setState({             
                    choose: '',
                    questionNumber: this.state.questionNumber + 1,
                    correctAnswer: '',
                });                
                this.customTitle(2);
            } else {
                this.alertPoints();
            }            
        }
    }
    render() {
        const current = this.state.questions[this.state.questionNumber -1] != undefined ? 
                        this.state.questions[this.state.questionNumber -1] : null;
        return (
            <SafeAreaView style={{flex:1, backgroundColor:'#F6F6F9'}}>
                <ScrollView ref='_scrollView'>                    
                    <View style={{backgroundColor: 'white'}}>
                        <View style={{ marginHorizontal:35, marginTop: 20, }}>                                
                            <View style={{ marginBottom: 30, }}>
                                <ImageWithAuth 
                                    resizeMode="cover" 
                                    style={{ flex:1, width: '100%', height: 116, resizeMode:'contain', marginTop:20, alignSelf:'center'}} 
                                    source={{ uri: constants.base + current.image.uri }} />
                            </View>
                            <View style={{ marginBottom: 40, marginHorizontal: 15, }}>
                                <Text style={styles.askText}>{current.question}</Text>
                            </View>
                        </View>
                    </View>                          
                    <View style={{flex:1, backgroundColor: '#F6F6F9'}}>
                        <View style={{ marginHorizontal:35, marginTop: 20, marginBottom:20}}>                
                            { /* Option A */ }     
                            { ['A', 'B', 'C', 'D'].map((letter, index) => {
                                return <View key={index}>
                                            <Card style={{marginBottom:10,}} >
                                                <TouchableOpacity onPress={() => this._validate(current.id ,'option' + letter)}>
                                                    <CardItem style={ 
                                                        this.state.choose != '' ?
                                                            this.state.choose == 'option' + letter ?
                                                                this.state.correctAnswer == 'option' + letter ?
                                                                    styles.answerCorrect 
                                                                :
                                                                    styles.answerError
                                                            :
                                                                this.state.correctAnswer == 'option' + letter ?
                                                                    styles.answerErrorCorrect
                                                                :
                                                                    styles.answerDefault
                                                        :
                                                            styles.answerDefault
                                                        }>                                
                                                        <Left>
                                                            {
                                                                this.state.choose != '' ?
                                                                    this.state.choose == 'option' + letter ?
                                                                        this.state.correctAnswer == 'option' + letter ?
                                                                            <Image source={ require('../../resources/trivia/icon-correct.png') } style={styles.letterImg}></Image>
                                                                        :
                                                                            <Image source={ require('../../resources/trivia/icon-incorrect.png') } style={styles.letterImg}></Image>
                                                                    : this.state.correctAnswer == 'option' + letter ?
                                                                        <View style={ [ styles.option, { backgroundColor:'#78C469'}] }>
                                                                            <Text style={ styles.optionText}>{letter}</Text>
                                                                        </View> :
                                                                        <View style={ [ styles.option, { }] }>
                                                                            <Text style={ styles.optionText}>{letter}</Text>
                                                                        </View>
                                                                : 
                                                                <View style={ [ styles.option, { }] }>
                                                                    <Text style={ styles.optionText}>{letter}</Text>
                                                                </View>       
                                                            }
                                                            <Body><Text style={ 
                                                                    this.state.choose != '' ?
                                                                        this.state.choose == 'option' + letter ?
                                                                            this.state.correctAnswer == 'option' + letter ?
                                                                                styles.answerTextWhite 
                                                                            :
                                                                                styles.answerTextWhite
                                                                        :
                                                                            this.state.correctAnswer == 'option' + letter ?
                                                                                styles.answerText
                                                                            :
                                                                                styles.answerText
                                                                    :
                                                                        styles.answerText
                                                                    }>{current['option' + letter]}</Text>
                                                            </Body>
                                                        </Left>                
                                                    </CardItem>
                                                </TouchableOpacity>
                                            </Card>
                                        { this.state.choose != '' && (this.state.correctAnswer == 'option' + letter) ?
                                            <Text style={styles.explanation}> {current.correctAnswerDescription} </Text>
                                            :
                                            null
                                        }       
                                      </View>;
                            })}             
                            <View style={styles.buttonContainer}>
                                <Button block success style={ (this.state.choose == '') ? styles.nextButtonDisable: styles.nextButtonEnable } onPress={this._onPressButton}>
                                {  this.state.questionNumber != 5 ? 
                                    <Text style= { styles.next }>{ strings.triviaCreateForm.form.nextQuestion }</Text>
                                    :
                                    <Text style= { styles.next }>{ strings.triviaCreateForm.form.end }</Text>
                                }
                                </Button>
                            </View>
                        </View>
                    </View>
                </ScrollView>
                { /* Error alert with retry */}
                <AwesomeAlertPlus
                    show={ this.state.showAlertRetry }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    showConfirmButton={false}
                    customView = {  <View style={ globalStyles.alertContainer }>
                                        <Image source={require('../../resources/global/icon-remove.png')} style={ globalStyles.alertImg}/>                             
                                        <Text style={ globalStyles.alertText }> {strings.general.error} </Text>
                                        <View style={{ marginTop: 20}}>
                                            <Button  style={[styles.retryButton,]} onPress={ () => this.retryAlert()} >
                                                <Text style={styles.next}> {strings.triviaCreateForm.retry}</Text>
                                            </Button>
                                            <Button style={styles.exitButton} onPress={ () => { this.exitAlert()} } >
                                                <Text style={styles.next}> {strings.triviaCreateForm.exit}</Text>
                                            </Button>
                                        </View>
                                    </View>
                                }
                />    
                { /* Alert cancel  */}
                <AwesomeAlertPlus
                    show={ this.state.showAlertCancel }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    showConfirmButton={false}
                    customView = {  <View> 
                                        <View style={{marginHorizontal:'15%'}}>
                                            <Text style={ globalStyles.alertTitle }> {strings.triviaAnswer.cancelAlert} </Text>
                                            <Text style={ globalStyles.alertText}> {strings.triviaAnswer.cancelMsg } </Text>
                                        </View>
                                        <View style={{flexDirection:'row',marginTop:10}}>
                                            <Button transparent style={[styles.cancelButton, { borderRight: 1, borderColor: '#AFADAD', borderRightWidth: 1}]}
                                                onPress={ () => this.setState({showAlertCancel:false})}>
                                                <Text style={styles.alertCancelButtonText}> {strings.triviaCreateForm.cancel}</Text>
                                            </Button>
                                            <Button transparent style={[styles.cancelButton]} onPress={ () => {
                                                this.setState({
                                                    showAlertCancel:false
                                                });
                                                setTimeout(()=>{
                                                    this.alertPoints()
                                                },1000);
                                             }}>
                                                <Text style={styles.alertCancelButtonText}> {strings.triviaCreateForm.confirm}</Text>
                                            </Button>
                                        </View>
                                    </View>
                                }
                />  
                { /* Alert validate  */}
                <AwesomeAlertPlus
                    show={ this.state.showAlertValidate }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    showConfirmButton={true}
                    onConfirmPressed={()=>{
                        this.setState({showAlertValidate:false});
                        setTimeout(() =>{
                            this.props.navigation.navigate('Trivia');
                        },100);
                    }}
                    customView = {  <View style={{ margin:20 }}>
                                        <Image source={require('../../resources/global/icon-tree-gen.png')} style={ globalStyles.alertImg }/> 
                                        <Text style={globalStyles.alertTitle}> { strings.triviaAnswer.goodLuck} </Text>
                                        <Text style={globalStyles.alertText}> {strings.triviaAnswer.goodLuckMsg} </Text>                
                                    </View>
                                }
                />  
                { /* Gamification alert  */}
                <GamificationAlert 
                    close = {true}
                    backFunc = { this.state.backFunc }
                    generalText = { this.state.gamificationAlertGeneralText }
                    eventResponseVM ={ this.state.eventResponseVM } />
                { this.state.isLoading && <Loader/> }                     
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    title:{
        color: 'white',
        fontSize: 15,
        fontWeight: '500',
        color: '#737373',
        lineHeight:25,
    },
    option:{
        backgroundColor:'#9B9B9B', 
        width:29, 
        height:29, 
        borderRadius:30, 
        justifyContent:'center'
    },
    optionText:{
        color:'white', 
        textAlign:'center'
    },
    askText:{        
        fontSize: 16,
        fontWeight: '400',
        textAlign: 'center',
        color: '#737373',
        lineHeight:25,
    },
    answerText:{        
        fontSize: 14,
        fontWeight: '400',
        color: '#737373',
        lineHeight:25,
    },  
    answerTextWhite:{        
        fontSize: 15,
        fontWeight: '400',
        color: '#fff'
    },    
    letterImg:{
        height: 29,
        width: 29,
        resizeMode: 'contain',
    },
    alertCancelButtonText:{
        fontSize: 18,
        fontWeight: '400',
        textAlign: 'center',
        color: '#208D5C'
    },
    cancelButton:{
        width:'50%',
        justifyContent:'center',
    },
    buttonContainer: {
        marginLeft: 40,
        marginRight: 40,
        marginTop: 20,
        marginBottom: 20,
    },
    nextButtonEnable: {
        backgroundColor:'#41B17C', 
        borderRadius: 5,
    },
    nextButtonDisable: {
        backgroundColor:'#9B9B9B', 
        borderRadius: 5,
    },
    next: {
        fontWeight:'bold',
        color: 'white',
    },
    answerCorrect:{
        backgroundColor: '#78C469'
    },
    answerErrorCorrect:{
        backgroundColor:"#fff",
        borderColor: '#78C469',
        borderWidth: 2,
    },
    answerError:{
        backgroundColor: '#EA585E'
    },
    answerDefault:{
        backgroundColor: '#fff'
    },
    explanation:{
        fontSize: 14,
        fontWeight: '400',
        textAlign: 'center',
        color: '#737373',
        lineHeight:25,
        marginTop: 10,
        marginBottom: 20,
        paddingHorizontal: 10,
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
        backgroundColor:'#EA585E', 
        borderRadius: 5,
        alignSelf: 'center',
        marginBottom: 10,
        width: '100%', 
        textAlign:'center',
        justifyContent:'center'
    },
});

const mapStateToProps = (state) => {
    return {
        param: state.param,
        idToken: state.user.id_token,
        loggedInStatus: state.loggedInStatus
    }
}

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}


export default connect(mapStateToProps, mapDispatchToProps)(TriviaAnswer);