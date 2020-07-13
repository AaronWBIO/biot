import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import { Col, Row } from "react-native-easy-grid";
import {
    StyleSheet,
    Text,
    SafeAreaView,
    Image,
    TouchableOpacity,
    View,
    Platform
} from 'react-native';
import { Button, Form, Item, Label, Input, ListItem, CheckBox, Body, Textarea, Icon } from 'native-base';
import strings from '../../config/languages';
import validationMessages from '../../config/validationMessages';
import CustomValidationComponent from '../../helpers/CustomValidationComponent';
import AwesomeAlertPlus from '../../components/awesome-alert/AwesomeAlertPlus';
import TriviaService from '../../services/trivia';
import MinIoService from '../../services/minio';
import Loader from '../../components/loader/Loader';
import constants from '../../config/constants';
import GamificationAlert from '../../components/awesome-alert/GamificationAlert';
import ImageWithAuth from '../../components/image';
import GeneralHelpers from '../../helpers/GeneralHelpers';
import globalStyles from '../../styles/global';
import ImagePicker from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import RNFetchBlob from 'rn-fetch-blob';
import Orientation from 'react-native-orientation';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

class TriviaCreateForm extends CustomValidationComponent {
    static navigationOptions = ({navigation}) => {
        const {params = {}} = navigation.state;
        return {
            title: strings.triviaCreateForm.title,
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
    validations = {
        ask: { required: true },
        answerA: { required: true },
        answerB: { required: true },
        answerC: { required: true },
        answerD: { required: true },
        explanation: { required: true },        
    }
    messages = validationMessages;
    deviceLocale = this.props.lang != undefined ? this.props.lang : 'es';
    constructor(props) {
        super(props)
        this.state = {
            backFunc: () => {},
            showAlertCancel: false,
            showErrorAlert: false,
            alertErrorText: '',
            showAlertRetry: false,
            showSuccessAlert: false,
            alertSuccessText: '',
            eventResponseVM: {},
            questionNumber: 1,
            maxQuestion: 5,
            questions: [],
            ask: '',
            answerA:'',
            answerB:'',
            answerC:'',
            answerD:'',
            optionA: false,
            optionB: false,
            optionC: false,
            optionD: false,
            correct:'',
            noOption: false,
            image:'',
            noPhoto: false,
            explanation:'',
            photo: null,
            formValid: false,
            triviaEntity: {},
            isLoading: false,
        }
    }
    componentDidMount() {
        Orientation.lockToPortrait();
        this.props.navigation.setParams({
            customBack: this.customBack.bind(this), 
        });
    }
    customBack(){
        if(this.state.questionNumber > 0){
            this.setState({
                showAlertCancel:true
            });
        } else {
            this.props.navigation.goBack();
        }        
    }
    _saveEntity(){
        this.setState({isLoading:true});
        let triviaEntity = {
            questions: this.state.questions
        }
        TriviaService.addTrivia(
            triviaEntity
        )            
        .then((res) => res.json())
        .then(res  => {
            if(res.status == 200 || res.status == 201){
                var eventResponseVM = res;
                if(eventResponseVM.points > 0) {
                    setTimeout(() => {
                        this.setState({isLoading:false});
                        this.setState({ 
                            close: true,
                            backFunc: () => { this.props.navigation.navigate('Trivia') },
                            gamificationAlertGeneralText: strings.triviaCreateForm.pointsMsg,
                            eventResponseVM:eventResponseVM});
                    },100)
                }            
            } else {
                this.setState({showAlertRetry:true});
            }
            this.setState({isLoading:false});
        }).catch((e) => {
            this.setState({showAlertRetry:true});
            this.setState({isLoading:false});
        });
        
    }
    _onPressButton = () => {
        this.refs._scrollView.scrollToPosition(0,0);
        if( this.state.correct == ''){
            this.setState({
                noOption: true
            });
        } else {
            this.setState({
                noOption: false
            });
        }
        if( this.state.image == ''){
            this.setState({
                noPhoto: true
            });
        } else {

            this.setState({
                noPhoto: false
            });
        }
        var valid = this.validate(this.validations);
        this.setState( {formValid:valid });  
        if (valid && (this.state.correct != '') && (this.state.image != '')) {
            var question = {
                correctAnswer: this.state.correct,
                correctAnswerDescription: this.state.explanation,
                enabled: true,
                image: this.state.photo,
                optionA: this.state.answerA,
                optionB: this.state.answerB,
                optionC: this.state.answerC,
                optionD: this.state.answerD,                
                question : this.state.ask,
            }   
            let addAsk = this.state.questions;
            addAsk.push(question);               
            if(this.state.questionNumber >= this.state.maxQuestion ){
                this._saveEntity();
                this.setState({
                    questions : addAsk,
                });
            } else {
                this.setState({
                    questions : addAsk,
                    questionNumber: this.state.questionNumber + 1, 
                    ask: '',
                    answerA: '',
                    answerB: '',
                    answerC: '',
                    answerD: '',
                    correct: '',
                    optionA: false,
                    optionB: false,
                    optionC: false,
                    optionD: false,
                    noOption: false,
                    image:'',
                    noPhoto: false,
                    explanation: '',
                    photo: null,
                });
            }
        } 
        this.refs._scrollView.scrollToPosition(0,0);
    }
    exitAlert = () => {
        this.setState({showAlertRetry:false});
        this.props.navigation.navigate('Trivia');
    }
    retryAlert =() => {
        this.setState({showAlertRetry:false});
        this._saveEntity()
    }
    selectPhoto(){
        this.setState({isLoading:true});
        const options = {
            title: strings.imagepicker.changePhoto,
            cancelButtonTitle: strings.imagepicker.cancelPhoto,
            takePhotoButtonTitle: strings.imagepicker.camera,
            chooseFromLibraryButtonTitle: strings.imagepicker.library,
            storageOptions: {
                skipBackup: true,
                path: 'images',
            },
        };
        ImagePicker.showImagePicker(options, (response) => {        
            if (response.didCancel) {
                this.setState({isLoading:false});
            } else if (response.error) {
                this.setState({isLoading:false});
            } else {
                ImageResizer.createResizedImage(response.uri, 1000, 700, 'JPEG', 80)
                .then(({ uri }) => {
                    let filePath = uri;
                    let fileName = GeneralHelpers.getUUID() + ".jpg";
                    let fileType = "image/jpeg";
                    if (Platform.OS === 'ios') {
                        let arr = uri.split('/')
                        const dirs = RNFetchBlob.fs.dirs
                        filePath = `${dirs.CacheDir}/${arr[arr.length - 1]}`
                    } 
                    RNFetchBlob.fs.readFile(filePath, 'base64')
                    .then((data) => {
                        var relatedId = null;
                        MinIoService.uploadFile('trivia',fileName, data, fileType, relatedId).then((resp) => {
                            if (resp.data != null ) {
                                var res = JSON.parse(resp.data);
                                if (res.message != undefined) {
                                    this.setState({ 
                                        isLoading:false, 
                                        alertErrorText: strings.imagePicker.error,
                                        showErrorAlert:true});                            
                                    return;
                                }                        
                                this.setState({ 
                                    isLoading:false, 
                                    showSuccessAlert:true,
                                    alertSuccessText: strings.imagePicker.uploadGeneral });
                                this.setState({photo:res, image: 1,});
                            } 
                            this.setState({isLoading:false});
                        }).catch((err) => {
                            this.setState({ 
                                isLoading:false, 
                                alertErrorText: strings.imagePicker.error,
                                showErrorAlert:true});  
                            this.setState({isLoading:false});
                        });
                    });
                })
                .catch(err => {
                    this.setState({isLoading:false});
                });
            }
        });
    }
    render() {
        return (
            <SafeAreaView>
                <KeyboardAwareScrollView ref='_scrollView' extraHeight={100}>
                    <View>                       
                        <View style={styles.purple}>
                            <Text style={styles.questionIndex}>
                                <Text>{strings.triviaCreateForm.question} </Text>
                                <Text>{this.state.questionNumber}</Text> 
                                <Text>{strings.triviaCreateForm.the}</Text> 
                                <Text>{this.state.maxQuestion}</Text> 
                            </Text>
                        </View>                       
                        <Form style={{marginHorizontal:40, marginTop: 20,}}>
                            <Text style={styles.label}>{strings.triviaCreateForm.form.question}</Text>
                            <Textarea rowSpan={2} style={[ styles.input, {borderBottomColor:'#b5b6b4', borderBottomWidth:1, lineHeight:14,}]}
                                    ref="ask"
                                    ref={component => this._ask = component}
                                    value={this.state.ask} 
                                    onChangeText={ (text) => this.setState({ ask: text }) } 
                            />
                                { this.isFieldInError('ask') && this.getErrorsInField('ask').map((errorMessage, i) => {
                                    return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                })}

                            <Item stackedLabel style={{marginLeft: 0, borderBottomColor: "#b5b6b4", marginTop:5}}>
                                <Label style={styles.label}>{strings.triviaCreateForm.form.answerA}</Label>
                                <Input style={styles.input} 
                                    ref="answerA"                                    
                                    ref={component => this._answerA = component}
                                    value={this.state.answerA}
                                    onChangeText={ (text) => this.setState({ answerA: text }) }                                
                                />
                            </Item>
                                { this.isFieldInError('answerA') && this.getErrorsInField('answerA').map((errorMessage, i) => {
                                    return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                })}

                            <Item stackedLabel style={{marginLeft: 0, borderBottomColor: "#b5b6b4", marginTop:5}}>
                                <Label style={styles.label}>{strings.triviaCreateForm.form.answerB}</Label>
                                <Input style={styles.input} 
                                    ref="answerB"
                                    ref={component => this._answerB = component}
                                    value={this.state.answerB}
                                    onChangeText={ (text) => this.setState({ answerB: text }) } 
                                />
                            </Item>
                                { this.isFieldInError('answerB') && this.getErrorsInField('answerB').map((errorMessage, i) => {
                                    return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                })}

                            <Item stackedLabel style={{marginLeft: 0, borderBottomColor: "#b5b6b4", marginTop:5}}>
                                <Label style={styles.label}>{strings.triviaCreateForm.form.answerC}</Label>
                                <Input style={styles.input} 
                                    ref="answerC"
                                    ref={component => this._answerC = component}
                                    value={this.state.answerC}
                                    onChangeText={ (text) => this.setState({ answerC: text }) } 
                                />
                            </Item>
                                { this.isFieldInError('answerC') && this.getErrorsInField('answerC').map((errorMessage, i) => {
                                    return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                })}

                            <Item stackedLabel style={{marginLeft: 0, borderBottomColor: "#b5b6b4", marginTop:5}}>
                                <Label style={styles.label}>{strings.triviaCreateForm.form.answerD}</Label>
                                <Input style={styles.input} 
                                    ref="answerD"
                                    ref={component => this._answerD = component}
                                    value={this.state.answerD}
                                    onChangeText={ (text) => this.setState({ answerD: text }) } 
                                />
                            </Item>
                                { this.isFieldInError('answerD') && this.getErrorsInField('answerD').map((errorMessage, i) => {
                                    return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                })}
                            <View style={{marginTop:30,}}>
                                <Text style={styles.label}>{strings.triviaCreateForm.form.correctAnswer}</Text>
                                <Row>
                                    <Col>
                                        <ListItem style={{borderBottomWidth:0, marginLeft: 0,}}>
                                            <CheckBox color={'#41B17C'} checked={this.state.optionA} onPress={ () => this.setState({ optionA: true, optionB: false, optionC: false, optionD:false, correct:"optionA"})}/>
                                            <Body>
                                                <Text style={{marginLeft:5, color:'#737373', fontSize:14}}>{strings.triviaCreateForm.form.optionA}</Text>
                                            </Body>
                                        </ListItem>
                                    </Col>
                                    <Col>
                                        <ListItem style={{borderBottomWidth:0, marginLeft: 0,}}>
                                            <CheckBox color={'#41B17C'} checked={this.state.optionC} onPress={ () => this.setState({ optionA: false, optionB: false, optionC: true, optionD:false, correct: "optionC"})}/>
                                            <Body>
                                                <Text style={{marginLeft:5, color:'#737373', fontSize:14}}>{strings.triviaCreateForm.form.optionC}</Text>
                                            </Body>
                                        </ListItem>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col>
                                        <ListItem style={{borderBottomWidth:0, marginLeft: 0,}}>
                                            <CheckBox color={'#41B17C'} checked={this.state.optionB} onPress={ () => this.setState({ optionA: false, optionB: true, optionC: false, optionD:false, correct: "optionB"})}/>
                                            <Body>
                                                <Text style={{marginLeft:5, color:'#737373', fontSize:14}}>{strings.triviaCreateForm.form.optionB}</Text>
                                            </Body>
                                        </ListItem>
                                    </Col>
                                    <Col>                                    
                                        <ListItem style={{borderBottomWidth:0, marginLeft: 0,}}>
                                            <CheckBox color={'#41B17C'} checked={this.state.optionD} onPress={ () => this.setState({ optionA: false, optionB: false, optionC: false, optionD:true , correct: "optionD"})}/>
                                            <Body >
                                                <Text style={{marginLeft:5, color:'#737373', fontSize:14}}>{strings.triviaCreateForm.form.optionD}</Text>
                                            </Body>
                                        </ListItem>
                                    </Col>
                                </Row>
                                { this.state.noOption ?
                                    <Text style={ styles.error }> {strings.triviaCreateForm.form.noOption} </Text> 
                                    :
                                    null
                                } 
                            </View>
                            <View style={{marginTop:30,}}>
                                <Text style={styles.label}>{strings.triviaCreateForm.form.explanation}</Text>
                                <Textarea rowSpan={3} style={[ styles.input, {borderBottomColor:'#b5b6b4', borderBottomWidth:1,}]}
                                    ref="explanation"
                                    ref={component => this._explanation = component}
                                    value={this.state.explanation}
                                    onChangeText={ (text) => this.setState({ explanation: text }) } 
                                />
                            </View>
                                { this.isFieldInError('explanation') && this.getErrorsInField('explanation').map((errorMessage, i) => {
                                    return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                })}
                            <View style={{borderBottomColor: '#b5b6b4', borderBottomWidth: 1,}}>
                                <TouchableOpacity onPress={ () => { this.selectPhoto() }}>
                                    <View style={{marginTop: 40, alignSelf: 'center', }}>
                                        { this.state.photo == null &&
                                            <View style={{borderWidth: 1, borderColor: '#979797', width: 80, height: 80, alignItems:'center', justifyContent:'center'}}>
                                                <Image source={require('../../resources/global/icon-photo-add.png')} style={{width: 80, height: 80, resizeMode:'contain'}}/>
                                            </View>
                                        }
                                        { this.state.photo != null &&
                                            <View style={{borderWidth: 1, borderColor: '#979797', width: 80, height: 80, alignItems:'center', justifyContent:'center'}}>
                                                <ImageWithAuth 
                                                        resizeMode='cover'
                                                        style={{ width: 80, height: 80}} 
                                                        source={{ uri: constants.base + this.state.photo.uri  }} />
                                            </View>
                                        }
                                    </View> 
                                    <Text style={{textAlign:'center', marginTop: 15, marginBottom:30, fontSize:12, color:'#828382', padding: 5}}> 
                                        {strings.triviaCreateForm.form.addphoto} 
                                    </Text>
                                </TouchableOpacity>

                                { this.state.noPhoto ?
                                    <Text style={ styles.error }>{strings.triviaCreateForm.form.noPhoto}</Text>
                                    :
                                    null
                                }
                            </View>
                            <Text style={{marginTop: 15, marginBottom:30, fontSize:12, color:'#737373'}}> {strings.triviaCreateForm.form.mandatory} </Text>
                        </Form>
                        <View style={styles.buttonContainer}>
                            <Button block success style={ styles.nextButton } onPress={this._onPressButton}>
                                {  this.state.questionNumber != 5 ? 
                                    <Text style= { styles.next }>{ strings.triviaCreateForm.form.nextQuestion }</Text>
                                    :
                                    <Text style= { styles.next }>{ strings.triviaCreateForm.form.end }</Text>
                                }
                            </Button>
                        </View>
                    </View>
                </KeyboardAwareScrollView>
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
                    onConfirmPressed={ () => { this.setState({showSuccessAlert:false})}}
                    onDismiss={ () => { this.setState({showSuccessAlert:false})}}
                    customView = { <View style={globalStyles.alertContainer}>
                                        <Image source={require('../../resources/global/icon-check.png')} style={ globalStyles.alertImg}/>                             
                                        <Text style={globalStyles.alertText}> { this.state.alertSuccessText }  </Text>
                                    </View> 
                                    }
                />   
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
                                            <Text style={ globalStyles.alertTitle }> {strings.triviaCreateForm.cancelAlert} </Text>
                                            <Text style={ globalStyles.alertText}> {strings.triviaCreateForm.cancelMsg } </Text>
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
                                                    this.props.navigation.navigate('Trivia');
                                                },1000);
                                             }}>
                                                <Text style={styles.alertCancelButtonText}> {strings.triviaCreateForm.confirm}</Text>
                                            </Button>
                                        </View>
                                    </View>
                                }
                />    
                { /* Gamification alert  */}
                <GamificationAlert 
                    close = {true}
                    backFunc = { this.state.backFunc }
                    generalText = { this.state.gamificationAlertGeneralText }
                    eventResponseVM ={ this.state.eventResponseVM } />                
                { this.state.isLoading && <Loader></Loader>}
            </SafeAreaView>
        )
    }
}
const styles = StyleSheet.create({
   purple:{
        backgroundColor: '#B062A9', 
        paddingVertical: 10,
   },
   questionIndex:{
        textAlign:'center', 
        color: '#fff', 
        fontSize: 16, 
        fontWeight:'400',
   },
   label:{
        color: '#737373', 
        fontSize: 14, 
        fontWeight:'700',
        paddingBottom: 7
   },
   input:{
        color: '#737373', 
        fontSize: 14, 
        fontWeight:'400',
   },
   buttonContainer: {
        marginLeft: 60,
        marginRight: 60,
        marginBottom: 40,
    },
    nextButton: {
        backgroundColor:'#41B17C', 
        borderRadius: 5,
    },
    next: {
        fontWeight:'bold',
        color: 'white',
        textAlign:'center'
    },
    error: {
        color: "#EA585E",
        fontSize: 12,
        paddingTop:10,
        paddingLeft:0,
        paddingBottom:10   
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

export default connect(mapStateToProps, mapDispatchToProps)(TriviaCreateForm);