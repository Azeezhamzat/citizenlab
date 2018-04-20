// Libraries
import React from 'react';
import PropTypes from 'prop-types';

import Radio, { Props as VanillaProps } from 'components/UI/Radio';

// Typings
export interface Props {
  name: string;
}
export interface State {}

class FormikRadio extends React.Component<Props & VanillaProps, State> {
  static contextTypes = {
    formik: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  handleOnChange = (value: string) => {
    this.context.formik.setFieldValue(this.props.name, value);
  }

  render() {
    return (
      <Radio
        {...this.props}
        currentValue={this.context.formik.values[this.props.name] || ''}
        onChange={this.handleOnChange}
      />
    );
  }
}

export default FormikRadio;
