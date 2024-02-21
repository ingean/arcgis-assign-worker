import FeatureList from "./components/FeatureList.js";
import { updateWorkers } from "./workers.js"
import { toggleProgessBar } from "./utils/utils.js";
import { ErrorAlert, WarningAlert, ConfirmationAlert } from './components/Alert.js'

let assignments = null
let allAssignments = null
let assignmentsList = null
let assignmentsLayer = null
let webmap = null 

export const getAssignments = async (map) => {
  webmap = map
  
  assignmentsLayer = webmap.getLayer(0, 1)
  assignmentsLayer.outFields = ['OBJECTID', 'ID', 'Navn', 'Adresse', 'Status', 'Kritikalitet', 'Opprettet', 'Beskrivelse']
  
  await refreshAssignments()
}

export const refreshAssignments = async () => {
  toggleProgessBar('assignments-progress')
 
  allAssignments = await queryAssignments(webmap, assignmentsLayer)
  assignments = allAssignments.filter(a => a.attributes.Status === 'Opprettet')
  
  addAssignmentToList(assignments)
}

export const workerStats = (workerId) => {
  let workerAssignments = allAssignments.filter(a => a.attributes['Feltarbeider_ID'] === workerId)
  let result = {
    totalcost: 0,
    count: 0
  }

  workerAssignments.forEach(a => {
    result.totalcost += a.attributes.Kostnad
    result.count++
  })
  return result
}


const queryAssignments = async (webmap, assignmentsLayer, where) => {
  const query = assignmentsLayer.createQuery()
  query.where = (where) ? where : '1 = 1'
  
  let result = await webmap.query(assignmentsLayer, query)

  if (!result.features.length) {
    new WarningAlert({message: 'Ingen oppdrag som ikke er allerede er allokert, igangsatt eller ferdigstilt'})
    return
  }
  return result.features
}

export const selectedAssignment = () => {
  if (assignmentsList) return assignmentsList.selectedFeature()
}

const addAssignmentToList = (assignments) => {
  assignments = assignments.map(f => {
    f.attributes.title = f.attributes.Navn
    f.attributes.descr = f.attributes.Kritikalitet
    return f
  })

  assignmentsList = new FeatureList('assignments-list', assignments, updateWorkers, {selectFirst: true})
  toggleProgessBar('assignments-progress')
  updateWorkers()
}

export const updateAssignment = (worker) => {
  toggleProgessBar('assignments-progress')
  
  let assignment = assignmentsList.selectedFeature()
  assignment.attributes['Feltarbeider_ID'] =  worker.attributes.GlobalID
  assignment.attributes['Feltarbeider_navn'] =  worker.attributes.Navn
  assignment.attributes.Status = 'Tildelt'
  
  const edits = {
    updateFeatures: [assignment]
  }

  console.log(`Start assigning worker ${worker.attributes.Navn}...`)
  assignmentsLayer.applyEdits(edits)
  .then(results => {
    const confirmation = new ConfirmationAlert({
      title: 'Oppdraget oppdatert',
      message: `Oppdraget ${assignment.attributes.Navn} er tildelt ${worker.attributes.Navn}.`,
    })
    refreshAssignments()
    toggleProgessBar('assignments-progress')
  })
  .catch(e => {
    const error = new ErrorAlert({
      title: 'Klarte ikke å tilordne oppdrag',
      message: `Oppdateringen feilet med meldingen: ${e}`,
    })
    toggleProgessBar('assignments-progress')
  })
}

