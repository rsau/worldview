import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

/*
 * AxisHoverLine for axis hover
 *
 * @class AxisHoverLine
 * @extends PureComponent
 */
class AxisHoverLine extends PureComponent {
  render() {
    const {
      axisWidth,
      isTimelineDragging,
      isAnimationDraggerDragging,
      showHoverLine,
      hoverLinePosition
    } = this.props;
    // check for timeline/animation dragging and showhover handled by parent
    const showHover = !isTimelineDragging && !isAnimationDraggerDragging && showHoverLine;
    let lineHeight = 63;
    // handle active layer count dependent tooltip height
    if (this.props.isDataCoveragePanelOpen) {
      lineHeight = 111;
      const addHeight = Math.min(this.props.activeLayers.length, 5) * 47;
      lineHeight += addHeight;
    }
    return (
      showHover &&
        <svg className="axis-hover-line-container" width={axisWidth} height={lineHeight} style={{ zIndex: 6 }}>
          <line className="axis-hover-line"
            stroke="#0f51c0" strokeWidth="2" x1="0" x2="0" y1="0" y2={lineHeight}
            transform={`translate(${hoverLinePosition + 1}, 0)`}
          />
        </svg>
    );
  }
}

AxisHoverLine.propTypes = {
  axisWidth: PropTypes.number,
  hoverLinePosition: PropTypes.number,
  isAnimationDraggerDragging: PropTypes.bool,
  isTimelineDragging: PropTypes.bool,
  showHoverLine: PropTypes.bool
};

export default AxisHoverLine;
