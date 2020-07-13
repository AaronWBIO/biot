import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import { Col, Grid } from "react-native-easy-grid";
import {
    StyleSheet,
    Text,
    SafeAreaView,
    ScrollView,
    Image,
    TouchableOpacity,
    View,
} from 'react-native';
import { Item, Button, Card, Icon, CardItem, CheckBox, Label, Input } from 'native-base';
import strings from '../../config/languages';
import validationMessages from '../../config/validationMessages';
import CustomValidationComponent from '../../helpers/CustomValidationComponent';
import globalStyles from '../../styles/global';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

class TreeFilters extends CustomValidationComponent {
    static navigationOptions = ({ navigation}) => ({
        title: strings.treeFilters.title,
        headerLeft: <TouchableOpacity style={globalStyles.headerLeft} onPress={ () => { navigation.goBack() }}>
            <Icon name="ios-arrow-back" style={globalStyles.headerLeftIcon}/>
        </TouchableOpacity>,        
        headerRight: (<View />),
        headerTintColor: colors.white,
        headerStyle: globalStyles.headerStyle,
        headerTitleStyle: globalStyles.headerTitleStyle,
    });    
    messages = validationMessages;
    deviceLocale = this.props.lang != undefined ? this.props.lang : 'es';
    validations = {
        trunkDiameterMax: { numbers: true,  minMaxValue:true },
        trunkDiameterMin: { numbers: true},
        treeHeightMax: { numbers: true,  minMaxValueV:true },
        treeHeightMin: { numbers: true}
    }
    constructor(props) {
        super(props)
        this.state = {
            formValid: true,
            specie: null,
            trunkDiameterMax: '',
            trunkDiameterMin: '',
            treeHeightMin: '',
            treeHeightMax: '',
            showWhitoutSpecies: false,
            showWhitoutDiameter: false,
            showInValidation: false,
            cqlAdvancedFilters: ''
        }  
        // Prepare custom validations
        this.messages['es']['minMaxValue'] = strings.treeFilters.minMaxValue;
        this.messages['es']['minMaxValueV'] = strings.treeFilters.minMaxValue;
        this.rules.minMaxValue = (status,value) => {
            if (this.state.trunkDiameterMin != '' || this.state.trunkDiameterMax != '') {
                if (parseFloat(this.state.trunkDiameterMin) > parseFloat(this.state.trunkDiameterMax)) {
                    return false;
                }
                if (this.state.trunkDiameterMin == '' || this.state.trunkDiameterMax == '') {
                    return false;
                }
            }
            return true;
        }
        this.rules.minMaxValueV = (status,value) => {
            if (this.state.treeHeightMin != '' || this.state.treeHeightMax != '') {
                if (parseFloat(this.state.treeHeightMin) > parseFloat(this.state.treeHeightMax)) {
                    return false;
                }
                if (this.state.treeHeightMin == '' || this.state.treeHeightMax == '') {
                    return false;
                }
            }
            return true;
        }
    }    
    clearFilters() {
        this.setState({
            formValid: true,
            specie: null,
            trunkDiameterMax: '',
            trunkDiameterMin: '',
            treeHeightMin: '',
            treeHeightMax: '',
            showWhitoutSpecies: false,
            showWhitoutDiameter: false,
            showInValidation: false,
            cqlAdvancedFilters:''
        }) 
        this.props.setParam({ cqlAdvancedFilters: '' });
        this.props.setParam({ cqlAdvancedFiltersState: '' });
        this.props.navigation.goBack();      
    }
    filter() {
        var valid = this.validate(this.validations);    
        this.setState({ formValid:valid });       
        if (valid) {
            var cqlAdvancedFilters = '';
            if (this.state.treeHeightMax !='' && this.state.treeHeightMin !='') {
                cqlAdvancedFilters += 'height+BETWEEN+' + this.state.treeHeightMin + '+AND+' + this.state.treeHeightMax;
            }
            if (this.state.trunkDiameterMin !='' && this.state.trunkDiameterMax !='') {
                if (cqlAdvancedFilters != '')
                    cqlAdvancedFilters += '+and+'
                cqlAdvancedFilters += '+diameter+BETWEEN+' + this.state.trunkDiameterMin + '+AND+' + this.state.trunkDiameterMax;
            }
            if (this.state.specie != null) {
                if (cqlAdvancedFilters != '')
                    cqlAdvancedFilters += '+and+'
                cqlAdvancedFilters += '+specie_id+=' + this.state.specie.id+'+';
            }
            if (this.state.showWhitoutSpecies == true) {
                if (cqlAdvancedFilters != '')
                    cqlAdvancedFilters += '+and+'
                cqlAdvancedFilters += '+specie_id+IS+NULL+';
            }
            if (this.state.showWhitoutDiameter == true) {
                if (cqlAdvancedFilters != '')
                    cqlAdvancedFilters += '+and+'
                cqlAdvancedFilters += '+diameter+IS+NULL+';
            }
            if (this.state.showInValidation == true) {
                if (cqlAdvancedFilters != '')
                    cqlAdvancedFilters += '+and+'
                cqlAdvancedFilters += "+tree_status+=+'DRAFT'+";
            }
            this.setState({
                cqlAdvancedFilters
            });
            this.props.setParam({ cqlAdvancedFilters: cqlAdvancedFilters });
            this.props.setParam({ cqlAdvancedFiltersState: this.state });
            this.props.navigation.goBack();
        }
    }
    componentDidMount(){
        if (this.props.param.cqlAdvancedFiltersState != undefined &&
            this.props.param.cqlAdvancedFiltersState != null &&
            this.props.param.cqlAdvancedFiltersState != ''
            ) {
                this.setState(this.props.param.cqlAdvancedFiltersState)
        } 
    }
    componentDidUpdate(prevProps, prevState) {
        if (prevProps.param !== this.props.param) {
            this.state.specie = this.props.param.specie;
            this.setState({specie: this.state.specie});
        }
    }
    render() {
        return ( 
            <SafeAreaView>
                <KeyboardAwareScrollView extraHeight={100}>
                    <View style={ styles.content}>
                    <TouchableOpacity onPress={() => this.props.navigation.navigate('SpeciesList') }>
                    <Card>
                        <CardItem>
                            <Grid style={{ padding:5}}>
                                <Col style={{ width:29, height:36}}>
                                    <Image style={{ width:29, height:36}} source={require('../../resources/global/icon-leaf.png')}></Image>
                                </Col>
                                <Col>
                                    <Text style={ [{ paddingLeft:20, padding:5, paddingBottom: 0, color:'#2CA06C' } ]}>
                                        { strings.treeFilters.chooseSpecieLabel }
                                    </Text>
                                    <Text style={ [ styles.stackedLabel, { paddingLeft:20, padding:5 } ]}>{ this.state.specie!= null ? this.state.specie.commonName : strings.treeFilters.specieDefaultLabel }</Text>
                                </Col>
                                <Col style={{ width:29, justifyContent:'center'}}>
                                    <Icon name="ios-arrow-forward" style={{ fontSize:24, color:"#2CA06C"}}/>
                                </Col>
                            </Grid>
                        </CardItem>
                    </Card>
                    </TouchableOpacity>
                    <Item stackedLabel style={styles.item} underline={false}>
                        <Label style={styles.stackedLabel}>{ strings.treeDetailFull.trunkDiameter}</Label>
                        <View style={{ flex:1, flexDirection: 'row'}}>
                            <Input 
                                    ref="trunkDiameterMin"
                                    ref={component => this._trunkDiameterMin = component}
                                    value= {this.state.trunkDiameterMin}
                                    placeholder={ strings.treeFilters.measurePlaceholder}
                                    style={ styles.rangeInputStyle }
                                    placeholderTextColor = '#979797'
                                    keyboardType="number-pad"
                                    onChangeText={ (text) => { 
                                        this.setState({ trunkDiameterMin: text }) 
                                    }}/>
                            <Text style={[ styles.stackedLabel, { alignSelf:'center', marginRight:10, marginLeft:10}]}>{ strings.treeFilters.rangeSeparator}</Text>
                            <Input 
                                    ref="trunkDiameterMax"
                                    ref={component => this._trunkDiameterMax = component}
                                    placeholder={ strings.treeFilters.measurePlaceholder}
                                    value= {this.state.trunkDiameterMax}
                                    keyboardType="number-pad"
                                    placeholderTextColor = '#979797'
                                    style={ styles.rangeInputStyle }
                                    onChangeText={ (text) => { 
                                            this.setState({ trunkDiameterMax: text }) 
                                    }}/>                                        
                        </View>
                    </Item>
                    { !this.state.formValid && this.isFieldInError('trunkDiameterMin') && this.getErrorsInField('trunkDiameterMin').map((errorMessage, i) => {
                        return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                    })}
                    { !this.state.formValid && this.isFieldInError('trunkDiameterMax') && this.getErrorsInField('trunkDiameterMax').map((errorMessage, i) => {
                        return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                    })}
                    <Item stackedLabel style={styles.item} underline={false}>
                        <Label style={styles.stackedLabel}>{ strings.treeFilters.treeHeight}</Label>
                        <View style={{ flex:1, flexDirection: 'row'}}>
                            <Input 
                                    ref="treeHeightMin"
                                    ref={component => this._treeHeightMin = component}
                                    value= {this.state.treeHeightMin}
                                    placeholder={ strings.treeFilters.measurePlaceholder}
                                    style={ styles.rangeInputStyle }
                                    placeholderTextColor = '#979797'
                                    keyboardType="number-pad"
                                    onChangeText={ (text) => { 
                                        this.setState({ treeHeightMin: text }) 
                                    }}/>                
                            <Text style={[ styles.stackedLabel, { alignSelf:'center', marginRight:10, marginLeft:10}]}>{ strings.treeFilters.rangeSeparator}</Text>
                            <Input 
                                    ref="treeHeightMax"
                                    ref={component => this._treeHeightMax = component}
                                    placeholder={ strings.treeFilters.measurePlaceholder}
                                    value= {this.state.treeHeightMax}
                                    keyboardType="number-pad"
                                    placeholderTextColor = '#979797'
                                    style={ styles.rangeInputStyle }
                                    onChangeText={ (text) => { 
                                        this.setState({ treeHeightMax: text }) 
                                    }}/>    
                        </View>
                    </Item>
                    { !this.state.formValid && this.isFieldInError('treeHeightMin') && this.getErrorsInField('treeHeightMin').map((errorMessage, i) => {
                        return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                    })}
                    { !this.state.formValid && this.isFieldInError('treeHeightMax') && this.getErrorsInField('treeHeightMax').map((errorMessage, i) => {
                        return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                    })}
                    <Item style={ styles.itemCheckBox }>
                        <TouchableOpacity style={{ flexDirection:'row'}} onPress={() =>  this.setState({ showWhitoutSpecies: !this.state.showWhitoutSpecies }) }>
                            <CheckBox
                                checked={ this.state.showWhitoutSpecies}
                                color='#2CA06C'
                                style={{ borderRadius:0 }}
                                onPress={() =>  this.setState({ showWhitoutSpecies: !this.state.showWhitoutSpecies }) }
                            />
                            <Text style={{ fontSize: 12, paddingLeft: 30, paddingTop:2, color:'#737373' }}>{ strings.treeFilters.showWhitoutSpecies }</Text>
                        </TouchableOpacity>
                    </Item>
                    <Item style={ styles.itemCheckBox }>
                        <TouchableOpacity style={{ flexDirection:'row'}} onPress={() =>  this.setState({ showWhitoutDiameter: !this.state.showWhitoutDiameter }) }>
                            <CheckBox
                                style={{ borderRadius:0 }}
                                checked={ this.state.showWhitoutDiameter}
                                color='#2CA06C'
                                onPress={() =>  this.setState({ showWhitoutDiameter: !this.state.showWhitoutDiameter }) }
                            />
                            <Text style={{ fontSize: 12, paddingLeft: 30, paddingTop:2, color:'#737373' }}>{ strings.treeFilters.showWhitoutDiameter }</Text>
                        </TouchableOpacity>
                    </Item>
                    <Item style={ styles.itemCheckBox }>
                        <TouchableOpacity style={{ flexDirection:'row'}} onPress={() =>  this.setState({ showInValidation: !this.state.showInValidation }) }>
                            <CheckBox
                                style={{ borderRadius:0 }}
                                checked={ this.state.showInValidation}
                                color='#2CA06C'
                                onPress={() =>  this.setState({ showInValidation: !this.state.showInValidation }) }
                            />
                            <Text style={{ fontSize: 12, paddingLeft: 30, paddingTop:2, color:'#737373' }}>{ strings.treeFilters.showInValidation }</Text>
                        </TouchableOpacity>
                    </Item>
                    <View style={styles.buttonContainer}>
                        <Button block success style={ styles.searchButton } onPress={ () => this.filter() } >
                            <Text style= { styles.search }>{ strings.treeFilters.searchButton }</Text>
                        </Button>
                    </View>
                    <View style={styles.buttonContainer}>
                        <Button block transparent danger onPress={() => this.clearFilters() }>
                            <Text style={{ color:'#EA585E'}}>{ strings.treeFilters.clearButton }</Text>
                        </Button>
                    </View>
                </View>                    
                </KeyboardAwareScrollView>
            </SafeAreaView>
        )  
    }
}

const styles = StyleSheet.create({
    content:{ 
        margin: 20
    },
    item: {
        marginTop:10,
        marginBottom: 10,
        borderBottomColor:'transparent',
        justifyContent: "center",
        alignItems: "center"      
    },
    itemCheckBox: {
        marginTop:10,
        marginBottom: 5,
        borderBottomColor:'transparent',
        alignItems: "center",
        padding:3,
    },
    stackedLabel: {
        color: '#828382',
        fontSize: 12,
        fontWeight: '400'
    },
    rangeInputStyle: {
        borderBottomColor:'#979797', 
        borderBottomWidth:1, 
        textAlign:'center',
        fontSize: 12,
        paddingTop: 0,
        paddingBottom: 0,
        marginBottom:0,
        marginTop:0,
        lineHeight: 14,
        height:40,
        color: '#737373', 
        fontSize: 14, 
        fontWeight:'400',
    },
    buttonContainer: {
        marginLeft: 60,
        marginRight: 60,
        marginTop: 10,
        marginBottom: 20,  
    },
    searchButton: {
        backgroundColor:'#41B07C', 
        borderRadius: 5,
    },
    search: {
        fontWeight:'bold',
        color: 'white',
    },
    error: {
        color: "#EA585E",
        fontSize: 12,
        paddingTop:5,
        paddingLeft:0,
        paddingBottom:10 
    },
});
 
const mapStateToProps = (state) => {
    return {
        loggedInStatus: state.loggedInStatus,
        param: state.param
    }
}

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}


export default connect(mapStateToProps, mapDispatchToProps)(TreeFilters);