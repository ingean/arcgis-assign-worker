
import { addFeaturesToMap } from "./main.js"
import FeatureSet from "@arcgis/core/rest/support/FeatureSet.js"
import { toggleProgessBar } from "./utils/utils.js"
import { ErrorAlert, WarningAlert, ConfirmationAlert } from './components/Alert.js'
import { solveODMatrix } from './ODMatrix.js'
import { time, distance, date } from "./utils/format.js"
import { selectedAssignment, updateAssignment, workerStats } from "./assignments.js";
import FeatureList from "./components/FeatureList.js";
import { div, label, chip, chipGroup } from "./utils/html.js"


const maxSearchDistance = 3
const lineSymbol = {
  type: "simple-line",  // autocasts as SimpleLineSymbol()
  color: [226, 119, 40],
  width: 10
}

let workers = null
let map = null
let workersLayer = null
let workersList = null
let closestWorkersList = null

export const getWorkers = async (webmap) => {
  map = webmap

  workersLayer = webmap.getLayer(0, 0)
  workersLayer.outFields = ['OBJECTID', 'ID', 'Navn', 'Firma', 'Sertifiseringer', 'Status', 'Tlf', 'GlobalID']

  updateWorkers()
}

export const updateWorkers = async () => {
  document.getElementById('assign-worker-btn').disabled = true
  document.getElementById('workers-block').description = 'Tilgjengelige ressurser basert på oppdragskritikalitet'
  let assignment = selectedAssignment()
  if (!assignment) return null

  let whereClause = createWhere(assignment)
  workersLayer.definitionExpression = whereClause
  
  let query = workersLayer.createQuery()
  query.where = whereClause
  let result = await map.query(workersLayer, query)
  workers = result.features

  if (workers.length === 0) {
    new WarningAlert({message: 'Ingen tilgjengelige feltarbeidere'})
    return
  }
  addAvailableWorkersToList(workers)
  findClosestWorkers()
}

const createWhere = (assignment) => {
  let where = "Status <> 'Utilgjengelig'"
  if (!assignment) return where
  
  let priority = assignment.attributes.Kritikalitet
  if (priority === 'Lav' || priority === 'Middels') where = "Status = 'Ledig'"
  if (priority === 'Høy') where = "Status IN ('Ledig', 'Opptatt')"
  if (priority === 'Kritisk') where = "Status <> 'Utilgjengelig'"
  return where
}

const addAvailableWorkersToList = (workers) => {
  workers = workers.map(f => {
    f.attributes.title = `${f.attributes.Navn} (${f.attributes.Firma})`
    f.attributes.descr = f.attributes.Status
    return f
  })

  workersList = new FeatureList('workers-list', workers)
}


const checkDestinations = (destinations) => {
  if (destinations.length == 0) {
    const error = new ErrorAlert({
      title: 'Finner ikke feltarbeider',
      message: `Ingen feltarbeidere nærmere enn ${maxSearchDistance} km fra valgt oppdrag`,
    })
    toggleProgessBar('workers-progress')
    return false
  } else if (destinations.length < getDestinationsToFind()) {
    const warning = new WarningAlert({
      title: 'Få tilgjengelige feltarbeidere',
      message: `Kun ${destinations.length} feltarbeidere som er tilgjengelig gitt oppdragets kritikalitet`
    })
    return true
  } else return true
}


export const findClosestWorkers = async () => {
  
  const assignment = selectedAssignment()
  const origin = new FeatureSet({features: [assignment]})
  
  let candidates = workers
  if (!checkDestinations(candidates)) return
  
  toggleProgessBar('workers-progress')
  candidates = candidates.slice(0, 1000) // Maximum 1000 destinations allowed
  const destinations = new FeatureSet({features: candidates})
 
  const data = await solveODMatrix(origin, destinations, getDestinationsToFind())
    
  showResultInList(data.features)
  showResultInMap(data)
  document.getElementById('assign-worker-btn').disabled = false
  document.getElementById('workers-block').description = 'Nærmeste ressurser'
  toggleProgessBar('workers-progress')
}

const showResultInList = (features) => {
  let workers = features.map(f => {
    let worker = getWorker(f.attributes.DestinationOID)
    //let stats = workerStats(worker.attributes.GlobalID)
    worker.attributes.title = `${worker.attributes.Navn} (${worker.attributes.Status})`
    worker.attributes.descr = `${time(f.attributes.Total_Time)} (${distance(f.attributes.Total_Distance)})` 
    return worker
  })
  closestWorkersList = new FeatureList('workers-list', workers, showWorkerDetails, {selectFirst: true})
  showWorkerDetails()
}

const showWorkerDetails = () => {
  let container = document.getElementById('worker-details-content')
  container.innerHTML = ''
  
  let worker = closestWorkersList.selectedFeature()
  let stats = workerStats(worker.attributes.GlobalID)
  
  let content = [ 
    label(worker.attributes.Navn),
    chipGroup('Statistikk', [
      chip(`${stats.count} oppdrag`, 'system-management'),
      chip(`${stats.totalcost} kr`, 'credits')
    ]),
    div('worker-details-date', `Siste oppdrag ${date(worker.attributes['Sist_Tildelt_Dato'])}`)
  ]
  container.appendChild(div('', content))
}

const showResultInMap = (data) => {
  addFeaturesToMap(data.features, data.fields, lineSymbol, 'Lines')
}

const getWorker = (oid) => {
  let worker = null
  workers.forEach(w => {
    if (w.attributes.OBJECTID === oid) worker = w
  })
  return worker
}

export const assignWorker = () => {
 
  toggleProgessBar('workers-progress')
  let worker = closestWorkersList.selectedFeature()
  updateAssignment(worker) 
  
  worker.attributes.Status = 'Tildelt'
  worker.attributes['Sist_Tildelt_Dato'] =  Date.now()
  
  const edits = {
    updateFeatures: [worker]
  }

  console.log(`Updating status for worker ${worker.attributes.Navn}...`)
  workersLayer.applyEdits(edits)
  .then(results => {
    const confirmation = new ConfirmationAlert({
      title: 'Status oppdatert for feltarbeider',
      message: `${worker.attributes.Navn} er nå tildelt valgt oppdrag.`,
    })
    toggleProgessBar('workers-progress')
  })
  .catch(e => {
    const error = new ErrorAlert({
      title: 'Klarte ikke å oppdatere status for feltarbeider',
      message: `Oppdateringen feilet med meldingen: ${e}`,
    })
    toggleProgessBar('workers-progress')
  })
}

export const getDestinationsToFind = () => {
  let element = document.getElementById("workers-count")
  return element.value
}



