import React, { Component } from 'react';
import {
    View,
    StyleSheet,    
    ActivityIndicator
} from 'react-native';

export default class Loader extends Component {
    render() {
        return (
                <View style={styles.wrapper}>
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator style={{alignItems:'center',justifyContent:'center', flex:1}} size="large" color="white" />
                    </View>
                </View>
        );
    }
}
const styles = StyleSheet.create({
    wrapper: {
        zIndex: 9,
        backgroundColor: 'rgba(0,0,0,0.01)',
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0
    },
    loaderImage: {
        width: 90,
        height: 90,
        borderRadius: 25
    },
    loaderContainer: {
        width: 90,
        height: 90,
        borderRadius: 15,
        backgroundColor: 'rgba(0,0,0,0.8)',
        position: 'absolute',
        left: '50%',
        top: '50%',
        marginLeft: -45,
        marginTop: -45
    }
});