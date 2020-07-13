import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import {
    StyleSheet,
    Text,
    SafeAreaView,
    ScrollView,
    Image,
    TouchableOpacity,
    View
} from 'react-native';
import { Button, Icon } from "native-base";
import strings from '../../config/languages';
import globalStyles from '../../styles/global';

class TriviaCreate extends Component {
    static navigationOptions = ({ navigation}) => ({
        title: strings.triviaCreate.title,
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
            triviaRules: [
                {id: 1, rule: strings.triviaCreate.rule1},
                {id: 2, rule: strings.triviaCreate.rule2},
                {id: 3, rule: strings.triviaCreate.rule3},
            ]
        }
    }
    render() {
        const { goBack } = this.props.navigation;
        return (
            <SafeAreaView> 
                <ScrollView> 
                    <View style={styles.wrapper}>                    
                        <Image source={require('../../resources/trivia/icon-main-create.png')} style={styles.icon}/>
                        <Text style={styles.message}> {strings.triviaCreate.message} </Text>
                        <Text style={styles.label}> {strings.triviaCreate.label} </Text>
                        { this.state.triviaRules.map( (item,key) => {
                            return (
                                <View key={item.id} style={{ flexDirection:'row'}}>
                                    <Text style={[styles.listItem, {marginRight:10}]}>{`\u2022`}</Text>
                                    <Text  style={styles.listItem}>{item.rule}</Text>
                                </View>    
                            ); 
                        })} 
                        <View style={styles.buttonContainer}>
                            <Button block success style={ styles.createButton } onPress={ () => this.props.navigation.navigate('TriviaCreateForm')}>
                                <Text style= { styles.create }>{ strings.triviaCreate.continue }</Text>
                            </Button>
                        </View>               
                    </View>
                </ScrollView>                      
            </SafeAreaView>
        )
    }
}
const styles = StyleSheet.create({
    wrapper:{
        marginHorizontal: 50,
        marginTop: 60,
    },
    icon:{
        width: 100,
        height: 99,
        resizeMode:'contain',
        alignSelf: 'center',
        
    },
    message:{
        fontSize: 18,
        fontWeight: '500',
        color: '#737373',
        lineHeight:30,
        textAlign: 'center',
        marginTop: 30,
        marginBottom: 30,
    },
    label:{
        fontSize: 14,
        fontWeight: '700',
        color: '#2ca06c',
        lineHeight:25,
    },
    listItem:{
        paddingTop: 5,
        color: '#737373',
        lineHeight:25,
    },
    buttonContainer: {
        marginLeft: 60,
        marginRight: 60,
        marginTop: 40,
        marginBottom: 20,
    },
    createButton: {
        backgroundColor:'#41B17C', 
        borderRadius: 5,
    },
    create: {
        fontWeight:'bold',
        color: 'white',
    },
});
const mapStateToProps = (state) => {
    return {
        loggedInStatus: state.loggedInStatus
    }
}
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}
export default connect(mapStateToProps, mapDispatchToProps)(TriviaCreate);