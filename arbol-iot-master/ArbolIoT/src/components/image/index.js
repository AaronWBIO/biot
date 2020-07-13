import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import { ImageBackground, ActivityIndicator } from 'react-native';
import colors from '../../styles/colors';

class ImageWithAuth extends Component{
    constructor(props) {
        super(props)
        this.state = {
            isLoading: false
        }
    }
    render() {
        return (
        <ImageBackground  
            { ...this.props }
            source={{ 
                ...this.props.source,
                headers: { Pragma: 'no-cache',  'Authorization' : "Bearer " + this.props.idToken }}}
            onLoadStart = { ()=>{ this.setState({ isLoading: true })}}  
            onLoadEnd = { ()=>{ this.setState({ isLoading: false })}}
            imageStyle = { this.props.style }>
            { this.state.isLoading && <ActivityIndicator color={colors.mainColor} style={{ position:'absolute', marginTop:-10, marginLeft:-10,left:'50%', top:'50%'}}></ActivityIndicator>}
        </ImageBackground> )
    }
}
const mapStateToProps = (state) => {
    return {
        idToken: state.user.id_token
    }
}
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}
export default connect(mapStateToProps, mapDispatchToProps)(ImageWithAuth);