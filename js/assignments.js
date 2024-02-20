import { WarningAlert } from "./components/Alert.js";
import FeatureList from "./components/FeatureList.js";
import { updateWorkers } from "./workers.js"
import { toggleProgessBar } from "./utils/utils.js";

let assignments = null
let assignmentsList = null 

export const getAssignments = async (webmap) => {
  toggleProgessBar('assignments-progress')
  const assignmentsLayer = webmap.getLayer(0, 1)
  assignmentsLayer.outFields = ['OBJECTID', 'ID', 'Navn', 'Adresse', 'Status', 'Kritikalitet', 'Opprettet', 'Beskrivelse']

  const query = assignmentsLayer.createQuery()
  query.where = "Status = 'Opprettet'"
  let result = await webmap.query(assignmentsLayer, query)

  assignments = result.features

  if (!assignments.length) {
    new WarningAlert({message: 'Ingen oppdrag som ikke er allerede er allokert, igangsatt eller ferdigstilt'})
    return
  }
  addAssignmentToList(assignments)
}

export const selectedAssignment = () => {
  //return selectedFeatureFromList('assignments-list', assignments)
  if (assignmentsList) return assignmentsList.selectedFeature()
}

const addAssignmentToList = (assignments) => {
/*   let list = document.getElementById('assignments-list')
  features.forEach((feature, idx) => {
    let item = listItem(idx, feature.attributes.Navn, feature.attributes.Kritikalitet, action('layer-zoom-to'))
    if (idx === 0) item.selected = true
    list.appendChild(item)
  })
  list.addEventListener('calciteListChange', updateWorkers )*/

  assignments = assignments.map(f => {
    f.attributes.title = f.attributes.Navn
    f.attributes.descr = f.attributes.Kritikalitet
    return f
  })

  assignmentsList = new FeatureList('assignments-list', assignments, updateWorkers, {selectFirst: true})
  toggleProgessBar('assignments-progress')
  updateWorkers()
}

