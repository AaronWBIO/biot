import ValidationComponent from 'react-native-form-validator';
import strings from '../config/languages';


export default class CustomValidationComponent extends ValidationComponent {
  constructor(props) {
      super(props);
  }
  _addError(fieldName, rule, value, isFn) {
    if( !strings.fieldsValidations[fieldName] )
      strings.fieldsValidations[fieldName] = fieldName;
    const errMsg = this.messages[this.deviceLocale][rule].replace("{0}", strings.fieldsValidations[fieldName]).replace("{1}", value);
    this.errors.push({
      fieldName,
      messages: [errMsg]
    });  }
}
