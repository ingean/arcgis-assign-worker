import esriConfig from "@arcgis/core/config.js";
import WebMapWrap from './components/WebMap.js'
import ActionBar from './components/ActionBar.js'
import MapTheme from './components/MapTheme.js'
import { authenticate } from './utils/OAuth2.js'
import { getWorkers } from './workers.js'
import { getAssignments } from "./assignments.js";

const appId = 'xG2kkVesAXGRx5t1'
const portal = await authenticate(appId) // ArcGIS Identity authentication

//esriConfig.apiKey = "AAPKf28ba4fdd1e945a1be5f8d43dbd650eaMjyiDjdFXaCPZzo5erYJ7Xc7XKvBlbJZIPvNu0O2zwfeFiGhqoBvtQwJUZ1DMXIL"

const webMapId = 'aabf1062ea0a4df7be90672dba78b369' // Shared with org
const webmap = new WebMapWrap(webMapId)

const actionBar = new ActionBar(webmap.view, 'closest')
const theme = new MapTheme(webmap.view) 

let resultLayer = null

webmap.map.when(() => {
  getAssignments(webmap)
  getWorkers(webmap)
})

export const addFeaturesToMap = (features, fields, symbol, title) => {
  resultLayer = webmap.addFeatures({features, fields, symbol, title, zoomTo: true})
}

export const resetMap = () => {
  webmap.map.remove(resultLayer)
  resultLayer = null
}

export const zoomToLayer = (layer) => {
  webmap.zoomToLayer(layer)
}

export const zoomToFeature = (geometry) => {
  webmap.zoomToFeature(geometry)
}
