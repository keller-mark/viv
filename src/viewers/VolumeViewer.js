import React, { useMemo } from 'react'; // eslint-disable-line import/no-unresolved
import { Matrix4 } from 'math.gl';

import { getPhysicalSizeScalingMatrix } from '../layers/utils';
import VivViewer from './VivViewer';
import { VolumeView, getDefaultInitialViewState } from '../views';
import { RENDERING_MODES } from '../constants';

/**
 * This component provides a volumetric viewer that provides provides volume-ray-casting.
 * @param {Object} props
 * @param {Array} props.sliderValues List of [begin, end] values to control each channel's ramp function.
 * @param {Array} props.colorValues List of [r, g, b] values for each channel.
 * @param {Array} props.channelIsOn List of boolean values for each channel for whether or not it is visible.
 * @param {string} [props.colormap] String indicating a colormap (default: '').  The full list of options is here: https://github.com/glslify/glsl-colormap#glsl-colormap
 * @param {Array} props.loader This data source for the viewer. PixelSource[]. If loader.length > 1, data is assumed to be multiscale.
 * @param {Array} props.loaderSelection Selection to be used for fetching data
 * @param {Array} [props.resolution] Resolution at which you would like to see the volume and load it into memory (0 highest, loader.length - 1 the lowest with default loader.length - 1)
 * @param {import('./VivViewer').ViewStateChange} [props.onViewStateChange] Callback that returns the deck.gl view state (https://deck.gl/docs/api-reference/core/deck#onviewstatechange).
 * @param {Array} [props.renderingMode] One of Maximum Intensity Projection, Minimum Intensity Projection, or Additive
 * @param {Object} [props.modelMatrix] A column major affine transformation to be applied to the volume.
 * @param {Array} [props.xSlice] 0-1 interval on which to slice the volume.
 * @param {Array} [props.ySlice] 0-1 interval on which to slice the volume.
 * @param {Array} [props.zSlice] 0-1 interval on which to slice the volume.
 * @param {function} [props.onViewportLoad] Function that gets called when the data in the viewport loads.
 * @param {Array} [props.viewStates] List of objects like [{ target: [x, y, z], zoom: -zoom, id: '3d' }] for initializing where the viewer looks (optional - this is inferred from height/width/loader
 * internally by default using getDefaultInitialViewState).
 * @param {number} props.height Current height of the component.
 * @param {number} props.width Current width of the component.
 * @param {Array.<Object>=} clippingPlanes List of math.gl [Plane](https://math.gl/modules/culling/docs/api-reference/plane) objects.
 */

const VolumeViewer = props => {
  const {
    loader,
    sliderValues,
    colorValues,
    channelIsOn,
    loaderSelection,
    colormap,
    resolution = loader.length - 1,
    modelMatrix,
    onViewStateChange,
    renderingMode = RENDERING_MODES.ADDITIVE,
    xSlice = [0, 1],
    ySlice = [0, 1],
    zSlice = [0, 1],
    onViewportLoad,
    height: screenHeight,
    width: screenWidth,
    viewStates: viewStatesProp,
    clippingPlanes = []
  } = props;
  const volumeViewState = viewStatesProp?.find(state => state.id === '3d');
  const initialViewState = useMemo(() => {
    if (volumeViewState) {
      return volumeViewState;
    }
    const { shape, labels } = loader[resolution];
    const height = shape[labels.indexOf('y')];
    const width = shape[labels.indexOf('x')];
    const depth = shape[labels.indexOf('z')];
    const depthDownsampled = Math.floor(depth / 2 ** resolution);
    const physicalSizeScalingMatrix = getPhysicalSizeScalingMatrix(
      loader[resolution]
    );
    const { zoom } = getDefaultInitialViewState(
      loader[resolution],
      { height: screenHeight, width: screenWidth },
      1
    );
    return {
      target: (modelMatrix || new Matrix4()).transformPoint(
        physicalSizeScalingMatrix.transformPoint([
          width / 2,
          height / 2,
          depthDownsampled / 2
        ])
      ),
      zoom,
      rotationX: 0,
      rotationOrbit: 0
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loader, resolution, modelMatrix]);
  const viewStates = [volumeViewState || { ...initialViewState, id: '3d' }];
  const volumeView = new VolumeView({
    id: '3d',
    target: initialViewState.target
  });
  const layerConfig = {
    loader,
    sliderValues,
    colorValues,
    channelIsOn,
    loaderSelection,
    colormap,
    xSlice,
    ySlice,
    zSlice,
    resolution,
    renderingMode,
    modelMatrix,
    onViewportLoad,
    clippingPlanes
  };
  const views = [volumeView];
  const layerProps = [layerConfig];
  // useDevicePixels false to improve performance: https://deck.gl/docs/developer-guide/performance#common-issues
  return loader ? (
    <VivViewer
      layerProps={layerProps}
      views={views}
      viewStates={viewStates}
      onViewStateChange={onViewStateChange}
      useDevicePixels={false}
    />
  ) : null;
};

export default VolumeViewer;
