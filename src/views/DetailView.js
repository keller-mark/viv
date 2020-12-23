import { MultiscaleImageLayer, ImageLayer, ScaleBarLayer } from '../layers';
import VivView from './VivView';
import { getVivId } from './utils';

/**
 * This class generates a MultiscaleImageLayer and a view for use in the VivViewer as a detailed view.
 * It takes the same arguments for its constructor as its base class VivView.
 * */
export default class DetailView extends VivView {
  getLayers({ props, viewStates }) {
    const { loader } = props;
    const { id, height, width } = this;
    const layerViewState = viewStates[id];
    const layers = [];

    const detailLayer = loader.isPyramid
      ? new MultiscaleImageLayer(props, {
          id: `${loader.type}${getVivId(id)}`,
          viewportId: id
        })
      : new ImageLayer(props, {
          id: `${loader.type}${getVivId(id)}`,
          viewportId: id
        });
    layers.push(detailLayer);

    const { physicalSizes } = loader;
    if (physicalSizes) {
      const { x } = physicalSizes;
      const { unit, value } = x;
      if (unit && value) {
        layers.push(
          new ScaleBarLayer({
            id: getVivId(id),
            loader,
            unit,
            size: value,
            viewState: { ...layerViewState, height, width }
          })
        );
      }
    }

    return layers;
  }

  /**
   * Create a viewState for this class, checking the id to make sure this class and viewState match.
   * @param {Object} args
   * @param {ViewState} args.ViewState ViewState object.
   * @returns {ViewState} ViewState for this class (or null by default if the ids do not match).
   */
  filterViewState({ viewState, currentViewState }) {
    if (viewState.id === 'overview') {
      const target = viewState.navigation?.target;
      if (target) {
        return { ...currentViewState, target };
      }
    }
    return super.filterViewState({ viewState });
  }
}
