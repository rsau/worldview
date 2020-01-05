import React from 'react';
import PropTypes from 'prop-types';
// import { CustomInput } from 'reactstrap';
import Switch from '../../util/switch';
import Scrollbar from '../../util/scrollbar';

class ClassificationToggle extends React.Component {
  render() {
    const { layer, legend, toggle } = this.props;
    const tooltips = legend.tooltips;
    return (
      <div className="layer-classification-toggle settings-component">
        <h2 className="wv-header">Category Enable/Disable</h2>
        <Scrollbar style={{ maxHeight: '200px' }}>
          {legend.colors.map((color, index) => {
            const id = legend.id + index;
            const tooltip = tooltips[index];
            return (
              <Switch key={id} color={color} label={tooltip} active={true} toggle={() => toggle(index)} />
            );
          })}
        </Scrollbar>
      </div>
    );

  }
}
ClassificationToggle.defaultProps = {
  start: 100
};
ClassificationToggle.propTypes = {
  layer: PropTypes.object,
  setOpacity: PropTypes.func,
  start: PropTypes.number
};

export default ClassificationToggle;
