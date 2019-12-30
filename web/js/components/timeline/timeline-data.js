import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment';
import {
  isEqual as lodashIsEqual
} from 'lodash';
import {
  timeScaleOptions
} from '../../modules/date/constants';
import { datesinDateRanges } from '../../modules/layers/util';
import Scrollbars from '../util/scrollbar';
import { Checkbox } from '../util/checkbox';

/*
 * Timeline Data Panel for layer coverage.
 *
 * @class TimelineData
 */

class TimelineData extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeLayers: [],
      matchingCoverage: [],
      isMatchingCoverageChecked: false,
      checkedLayerIds: {}
    };
  }

  componentDidMount() {
    this.setActiveLayers();
    // prevent bubbling to parent which the wheel event is blocked for timeline zoom in/out wheel event
    document.querySelector('.timeline-data-panel-container').addEventListener('wheel', (e) => e.stopPropagation(), { passive: false });
  }

  componentDidUpdate(prevProps) {
    const { activeLayers } = this.props;
    // need to update layer toggles for show/hide/remove
    if (!lodashIsEqual(prevProps.activeLayers, activeLayers)) {
      this.setActiveLayers();
      if (activeLayers.length === 0) {
        this.closeModal();
      }
    }
  }

  setActiveLayers = () => {
    const { activeLayers } = this.props;
    this.setState({
      activeLayers
    });
  }

  getLineDimensions = (layer, rangeStart, rangeEnd) => {
    const {
      appNow,
      axisWidth,
      position,
      timeScale,
      timelineStartDateLimit,
      transformX
    } = this.props;
    const postionTransformX = position + transformX;
    const gridWidth = timeScaleOptions[timeScale].timeAxis.gridWidth;
    const frontDate = new Date(this.props.frontDate);
    const backDate = new Date(this.props.backDate);
    let layerStart, layerEnd;

    if (rangeStart || layer.startDate) {
      layerStart = new Date(rangeStart || layer.startDate);
    } else {
      layerStart = new Date(timelineStartDateLimit);
    }
    if (rangeEnd || layer.inactive === true) {
      layerEnd = new Date(rangeEnd || layer.endDate);
    } else {
      layerEnd = new Date(appNow);
    }

    let visible = true;
    if (layerStart > backDate || layerEnd < frontDate) {
      visible = false;
    }

    let leftOffset = 0;
    let borderRadiusLeft = '0';
    let borderRadiusRight = '0';
    // TODO: temp double value to accomodate backDate/frontDate update delay
    let width = axisWidth * 2;
    if (visible) {
      if (layerStart < frontDate) {
        leftOffset = 0;
      } else {
        // positive diff means layerStart more recent than frontDate
        const diff = moment.utc(layerStart).diff(frontDate, timeScale, true);
        leftOffset = gridWidth * diff + postionTransformX;
        borderRadiusLeft = '3px';
      }

      if (layerEnd < backDate) {
        // positive diff means layerEnd earlier than back date
        const diff = moment.utc(layerEnd).diff(frontDate, timeScale, true);
        width = gridWidth * diff + postionTransformX - leftOffset;
        borderRadiusRight = '3px';
      }
    }

    const borderRadius = `${borderRadiusLeft} ${borderRadiusRight} ${borderRadiusRight} ${borderRadiusLeft}`;

    return {
      visible: visible,
      leftOffset: leftOffset,
      width: width,
      borderRadius: borderRadius
    };
  }

  closeModal = () => {
    this.props.toggleDataCoveragePanel(false);
  }

  toggleCoverageToFilterPool = (isChecked, layer) => {
    const { matchingCoverage, checkedLayerIds, isMatchingCoverageChecked } = this.state;

    let newMatchingCoverage;
    if (isChecked) {
      // add layer
      const newCoverage = {
        layerId: layer.id,
        startDate: layer.startDate,
        endDate: layer.endDate
      };
      newMatchingCoverage = matchingCoverage.concat(newCoverage);
      checkedLayerIds[layer.id] = true;
    } else {
      // remove toggled layer
      newMatchingCoverage = matchingCoverage.filter((x) => x.layerId !== layer.id);
      delete checkedLayerIds[layer.id];
    }

    this.setState({
      matchingCoverage: newMatchingCoverage,
      checkedLayerIds: checkedLayerIds
    }, () => {
      if (isMatchingCoverageChecked) {
        this.addMatchingCoverageToTimeline(true);
      }
    });
  }

  addMatchingCoverageToTimeline = (isChecked) => {
    let dateRange;
    if (isChecked) {
      dateRange = this.getNewMatchingDatesRange();
    } else {
      dateRange = {};
    }
    this.props.setMatchingTimelineCoverage(dateRange);
    this.setState({
      isMatchingCoverageChecked: isChecked
    });
  }

  // return startDate and endDate based on layers currently selected for matching coverage
  getNewMatchingDatesRange = () => {
    const { matchingCoverage } = this.state;

    let startDate;
    let endDate = new Date(this.props.appNow);
    if (matchingCoverage.length > 0) {
      // get start date
      // for each start date, find latest that is still below end date
      const startDates = matchingCoverage.reduce((acc, x) => {
        return x.startDate ? acc.concat(x.startDate) : acc;
      }, []);
      // console.log(startDates);

      // for each end date, find earlier that is still after start date
      const endDates = matchingCoverage.reduce((acc, x) => {
        return x.endDate ? acc.concat(x.endDate) : acc;
      }, []);
      // console.log(endDates);

      // set as matching end date
      for (let i = 0; i < startDates.length; i++) {
        const date = new Date(startDates[i]);
        if (i === 0) {
          startDate = date;
        }
        if (date.getTime() > startDate.getTime()) {
          startDate = date;
        }
      }
      for (let i = 0; i < endDates.length; i++) {
        const date = new Date(endDates[i]);
        if (i === 0) {
          endDate = date;
        }
        if (date.getTime() < endDate.getTime()) {
          endDate = date;
        }
      }
      return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
    }
  }

  render() {
    const maxHeightScrollBar = '230px';
    const animateBottomClassName = `${this.props.isDataCoveragePanelOpen ? 'animate-timeline-data-panel-slide-up' : ''}`;
    return (
      <div className={`timeline-data-panel-container ${animateBottomClassName}`} style={{
        left: `${this.props.parentOffset - 10}px`,
        width: `${this.props.axisWidth + 78}px`
      }}>
        {this.props.isDataCoveragePanelOpen
          ? <div
            className={'timeline-data-panel'}
            style={{
              width: `${this.props.axisWidth + 78}px`
            }}>
            <header
              className={'timeline-data-panel-header'}
            >
              <h3>LAYER COVERAGE</h3>
              <Checkbox
                checked={this.state.isMatchingCoverageChecked}
                classNames='wv-checkbox-data-matching-main'
                id='wv-checkbox-data-matching-main'
                label='Show Matching Coverage on Timeline'
                name='wv-checkbox-data-matching-main'
                onCheck={(isChecked) => this.addMatchingCoverageToTimeline(isChecked)}
                inputPosition={'right'}
                title='Show Matching Coverage on Timeline'
                optionalCaseClassName={'timeline-data-panel-wv-checkbox-container'}
                optionalLabelClassName={'timeline-data-panel-wv-checkbox-label'}
              />
              <i className="fa fa-times wv-close" onClick={this.closeModal}/>
            </header>
            <Scrollbars style={{ maxHeight: maxHeightScrollBar }}>
              <div className="data-panel-layer-list">
                {this.state.activeLayers.map((layer, index) => {
                  let multipleCoverageRanges = false;
                  if (layer.dateRanges) {
                    multipleCoverageRanges = layer.dateRanges.length > 1;
                  }

                  const options = this.getLineDimensions(layer);
                  const enabled = layer.visible;
                  // get date range to display
                  const dateRangeStart = (layer.startDate && layer.startDate.split('T')[0]) || 'start';
                  const dateRangeEnd = (layer.endDate && layer.endDate.split('T')[0]) || 'present';
                  const dateRange = `${dateRangeStart} - ${dateRangeEnd}`;
                  return (
                    <React.Fragment key={index}>
                      <div className={`data-panel-layer-item-${layer.id}`}
                        style={{
                          borderBottom: '1px solid #3c3c3c'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', padding: '5px' }}>
                          <div className="data-panel-layer-item-title">{layer.title} <span className="data-panel-layer-item-subtitle">{layer.subtitle}</span></div>
                          <Checkbox
                            checked={!!this.state.checkedLayerIds[layer.id]}
                            classNames='wv-checkbox-data-matching-layer'
                            id={`wv-checkbox-data-matching-${layer.id}`}
                            label={dateRange}
                            name={`wv-checkbox-data-matching-${layer.id}`}
                            onCheck={(isChecked) => this.toggleCoverageToFilterPool(isChecked, layer)}
                            inputPosition={'right'}
                            title='Add Layer to Matching Coverage Filter'
                            optionalCaseClassName={'timeline-data-panel-wv-checkbox-container-layer'}
                            optionalLabelClassName={'timeline-data-panel-wv-checkbox-label-layer'}
                          />
                        </div>
                        <div className={`data-panel-layer-coverage-line-${layer.id}`} style={{ maxWidth: `${this.props.axisWidth}px`, overflow: 'hidden' }}>
                          {multipleCoverageRanges
                            ? <div style={{
                              position: 'relative',
                              width: `${options.width}px`,
                              maxWidth: `${this.props.axisWidth}px`,
                              height: '30px',
                              overflow: 'hidden',
                              // borderRadius: '5px',
                              visibility: options.visible ? 'visible' : 'hidden',
                              display: 'flex',
                              margin: '0 0 6px 0',
                              border: '1px solid grey'
                            }}>
                              {layer.dateRanges.map((range, index) => {
                              // console.log(range);
                                const rangeStart = range.startDate;
                                const rangeEnd = range.endDate;
                                const rangeInterval = Number(range.dateInterval);
                                let rangeOptions;
                                if (rangeInterval !== 1) {
                                // const layerPeriod = layer.period;
                                  const startDateLimit = new Date(this.props.frontDate);
                                  let endDateLimit = new Date(this.props.backDate);
                                  if (new Date(this.props.appNow) < endDateLimit) {
                                    endDateLimit = new Date(this.props.appNow);
                                  }

                                  let dateIntervalStartDates = [];
                                  if (new Date(rangeStart) < endDateLimit && new Date(rangeEnd) > startDateLimit) {
                                    const frontBackDiff = moment.utc(endDateLimit).diff(startDateLimit, this.props.timeScale);
                                    const midDate = moment.utc(startDateLimit).add(Math.floor(frontBackDiff / 2), this.props.timeScale);
                                    const midDateFormat = new Date(midDate.format());
                                    console.log(frontBackDiff, new Date(midDate.format()));
                                    // TODO: need to accomodate full front/back dates
                                    dateIntervalStartDates = datesinDateRanges(layer, midDateFormat, startDateLimit, endDateLimit);
                                  // dateIntervalStartDates = datesinDateRanges(layer, startDateLimit);
                                  }

                                  return dateIntervalStartDates.map((rangeDate, index) => {
                                  // console.log(rangeDate);
                                    const minYear = rangeDate.getUTCFullYear();
                                    const minMonth = rangeDate.getUTCMonth();
                                    const minDay = rangeDate.getUTCDate();
                                    const rangeDateEnd = new Date(minYear, minMonth, minDay + rangeInterval);
                                    rangeOptions = this.getLineDimensions(layer, rangeDate, rangeDateEnd);
                                    // console.log(rangeDate.toISOString(), rangeOptions);

                                    const border = index > 0 && index < dateIntervalStartDates.length - 1 ? '1px solid white' : '1px solid transparent';
                                    // const borderRadius = index > 0 && index < dateIntervalStartDates.length - 1 ? '0' : '5px';
                                    return (
                                    // null
                                      <React.Fragment key={index}>
                                        <div style={{
                                          position: 'absolute',
                                          left: rangeOptions.leftOffset,
                                          width: `${rangeOptions.width}px`,
                                          // maxWidth: `${this.props.axisWidth}px`,
                                          height: '30px',
                                          backgroundColor: enabled ? '#00457B' : 'grey',
                                          border: border,
                                          // borderRadius: borderRadius,
                                          visibility: rangeOptions.visible ? 'visible' : 'hidden',
                                          margin: '0 0 6px 0'
                                        }}>{index}{rangeDate.toISOString()}</div>
                                      </React.Fragment>
                                    );
                                  });
                                } else {
                                  rangeOptions = this.getLineDimensions(layer, rangeStart, rangeEnd);
                                  return (
                                    <React.Fragment key={index}>
                                      <div style={{
                                        position: 'absolute',
                                        left: rangeOptions.leftOffset,
                                        width: `${rangeOptions.width}px`,
                                        // maxWidth: `${this.props.axisWidth}px`,
                                        height: '10px',
                                        backgroundColor: enabled ? '#00457B' : 'grey',
                                        // borderRadius: '5px',
                                        visibility: rangeOptions.visible ? 'visible' : 'hidden',
                                        margin: '0 0 6px 0',
                                        border: '1px solid grey'
                                      }}>{rangeStart}</div>
                                    </React.Fragment>
                                  );
                                }
                              })}
                            </div>
                            : <div className="data-panel-coverage-line" style={{
                              left: options.leftOffset,
                              width: `${options.width}px`,
                              backgroundColor: enabled ? '#00457B' : 'grey',
                              borderRadius: options.borderRadius,
                              visibility: options.visible ? 'visible' : 'hidden'
                            }}>
                            </div>
                          }
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </Scrollbars>
          </div>
          : null
        }
      </div>
    );
  }
}

function mapStateToProps(state) {
  const {
    compare,
    layers,
    date
  } = state;
  const {
    appNow
  } = date;

  const activeLayers = layers[compare.activeString].filter(activeLayer => activeLayer.startDate);

  return {
    activeLayers,
    appNow
  };
}

const mapDispatchToProps = dispatch => ({
});

TimelineData.propTypes = {
  activeLayers: PropTypes.array,
  appNow: PropTypes.object,
  axisWidth: PropTypes.number,
  backDate: PropTypes.string,
  frontDate: PropTypes.string,
  isDataCoveragePanelOpen: PropTypes.bool,
  matchingTimelineCoverage: PropTypes.object,
  parentOffset: PropTypes.number,
  position: PropTypes.number,
  setMatchingTimelineCoverage: PropTypes.func,
  timelineStartDateLimit: PropTypes.string,
  timeScale: PropTypes.string,
  toggleDataCoveragePanel: PropTypes.func,
  transformX: PropTypes.number
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TimelineData);
