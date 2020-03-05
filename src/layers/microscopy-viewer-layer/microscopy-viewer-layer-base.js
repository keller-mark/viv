import { BaseTileLayer } from '@deck.gl/layers';
import { COORDINATE_SYSTEM } from '@deck.gl/core';
import { XRLayer } from '../xr-layer';
import { tileToScreen, getRasterTileIndices } from './tiling-utils';

import { padWithDefault } from './utils';

const MAX_SLIDERS_AND_CHANNELS = 6;
const MAX_COLOR_INTENSITY = 255;
const DEFAULT_COLOR_OFF = [0, 0, 0];

const defaultProps = {
  ...BaseTileLayer.defaultProps,
  pickable: false,
  coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
  maxSliderValue: 65535,
  maxZoom: 0,
  onViewportLoad: false,
  renderSubLayers: props => {
    const {
      bbox: { west, south, east, north }
    } = props.tile;
    const { sliderValues, data, colorValues, loader } = props;
    const xrl = new XRLayer(props, {
      id: `XR-Layer-${west}-${south}-${east}-${north}-${loader.type}`,
      pickable: false,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      data,
      sliderValues,
      colorValues,
      bounds: [west, south, east, north],
      visible: true
    });
    return xrl;
  }
};

export class MicroscopyViewerLayerBase extends BaseTileLayer {
  constructor(props) {
    const {
      sliderValues,
      colorValues,
      channelIsOn,
      loader,
      maxSliderValue
    } = props;

    const lengths = [sliderValues.length, colorValues.length];
    if (lengths.every(l => l !== lengths[0])) {
      throw Error('Inconsistent number of slider values and colors provided');
    }

    const colors = colorValues.map((color, i) =>
      channelIsOn[i]
        ? color.map(c => c / MAX_COLOR_INTENSITY)
        : DEFAULT_COLOR_OFF
    );

    const sliders = sliderValues.map((slider, i) =>
      channelIsOn[i] ? slider : [maxSliderValue, maxSliderValue]
    );

    // Need to pad sliders and colors with default values (required by shader)
    const padSize = MAX_SLIDERS_AND_CHANNELS - colors.length;
    if (padSize < 0) {
      throw Error('Too many channels specified for shader.');
    }
    const paddedSliderValues = padWithDefault(
      sliders,
      [maxSliderValue, maxSliderValue],
      padSize
    );

    const paddedColorValues = padWithDefault(
      colors,
      DEFAULT_COLOR_OFF,
      padSize
    );

    const getTileData = ({ x, y, z }) =>
      loader.getTile({ x, y, z: -z, ...props });
    const overrideValuesProps = {
      ...props,
      sliderValues: paddedSliderValues.flat(), // flatten for use on shaders
      colorValues: paddedColorValues,
      getTileData,
      // eslint-disable-next-line no-shadow
      getTileIndices: (viewport, maxZoom, minZoom) => {
        return getRasterTileIndices({
          viewport,
          maxZoom,
          minZoom,
          ...props
        });
      },
      tileToBoundingBox: (x, y, z) => {
        return tileToScreen({
          x,
          y,
          z,
          ...props
        });
      }
    };
    const layerProps = { ...defaultProps, ...overrideValuesProps };
    super(layerProps);
  }
}

MicroscopyViewerLayerBase.layerName = 'MicroscopyViewerLayerBase';
MicroscopyViewerLayerBase.defaultProps = defaultProps;
