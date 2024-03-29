export const time = (mins) => {
  if (mins < 60) return `${Math.round(mins)} min`
  const hrs = Math.floor(mins/60)
  const m = mins % 60
  
  return `${hrs} t ${Math.round(m)} m`
}

export const distance = (kms) => {
  return (kms >= 3) ? `${Math.round(kms * 10) / 10} km` : `${Math.round(kms * 1000)} m`
}

export const date = (epoch) => {
  let d = new Date(0)
  d.setUTCMilliseconds(epoch)
  return `${d.getDay()}.${d.getMonth() + 1}.${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}`
}