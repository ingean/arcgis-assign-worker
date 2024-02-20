import { listItem, action } from "../utils/html.js";
import { zoomToFeature } from "../main.js"

export default class FeatureList {
  constructor(listId, features, title, desc, onSelect, options) {
    this.listId = listId
    this.list = document.getElementById(this.listId)
    this.features = features
    this.options = options

    this.addFeaturesToList(features, title, desc, onSelect, options)
  }

  clearList = () => {
    this.list.innerHTML = ''
  }

  addFeaturesToList = (features, onSelect, options) => {
    this.clearList()

    features.forEach((feature, idx) => {
      let actionBtn = action('layer-zoom-to')
      actionBtn.addEventListener('click', zoomToFeature(feature.geometry))

      let item = listItem(idx, feature.attributes.title, feature.attributes.descr, actionBtn)
      
      if (options?.selectFirst) {
        if (idx === 0) item.selected = true
      }
      this.list.appendChild(item)
    })
    this.list.addEventListener('calciteListChange', onSelect)
  }

  selectedItem = () => {
    let selectedItem = null

    Array.from(this.list.children).forEach(item => {
      if (item.selected) selectedItem = item
    })

    return selectedItem
  }

  selectedFeature = () => {
    let selectedItem = this.selectedItem()

    if (!selectedItem) return null
    let id = selectedItem.getAttribute('data-item-id')
    return this.features[id]
  }
}