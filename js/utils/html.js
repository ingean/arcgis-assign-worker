function appendChildren(el, children) {
  if (typeof children === 'string' || typeof children === 'number') {
    el.appendChild(document.createTextNode(children));
  } else if (children instanceof Array) {
        for (let child of children) {
          if (typeof child === 'string' || typeof child === 'number') {
              el.appendChild(document.createTextNode(child));
          } else if (child instanceof Node){
              el.appendChild(child);
          }
      }
  } else if (children instanceof Node){
      el.appendChild(children)
  }
  return el;
} 

export function element(tagName, attributes, children) {
  let el = document.createElement(tagName || 'div');
    
  if (attributes) {
    if (typeof attributes === 'string') {
      el.setAttribute('class', attributes)
    } else {
      for (let name in attributes) {
        el.setAttribute(name, attributes[name]);
      }
    }    
  }
  if (!children) return el;
  return appendChildren(el, children)
}

export const div = (attributes, children) => {
  return element('div', attributes, children)
}

export const label = (caption, children) => {
  if (children) {
    children.unshift(caption)
    return element('calcite-label', null, children)
  } else {
    return element('calcite-label', null, caption)
  }
}

export const chip = (caption, icon) => {
  let attr = (icon) ? {icon} : null
  return element('calcite-chip', attr, caption)
}

export const chipGroup = (caption, chips) => {
  return element('calcite-chip-group', {label: caption}, chips)
}

export const listItem = (id, label, description, action) => {
  let listItem = element('calcite-list-item', { label, description }, action)
  listItem.setAttribute('data-item-id', id)
  return listItem
}

export const action = (icon) => {
 return element('calcite-action', { slot: 'actions-end', icon })
} 