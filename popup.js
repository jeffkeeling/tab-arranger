document.addEventListener('DOMContentLoaded', () => {
  const tabList = document.getElementById('tabList')
  const saveButton = document.getElementById('saveButton')
  let tabs = []
  let draggingElement = null

  function createTabElement(tab, index) {
    const li = document.createElement('li')
    li.innerHTML = `
            <img class="favicon" src="${
              tab.favIconUrl || 'favicon.ico'
            }" alt="Favicon">
            <span class="tab-title">${tab.title}</span>
        `
    li.draggable = true
    li.setAttribute('data-id', tab.id)
    li.setAttribute('data-index', index)

    li.addEventListener('dragstart', (e) => {
      draggingElement = li
      e.dataTransfer.effectAllowed = 'move'
      li.classList.add('dragging')
    })

    li.addEventListener('dragover', (e) => {
      e.preventDefault()
    })

    li.addEventListener('dragenter', (e) => {
      e.preventDefault()
      if (li !== draggingElement) {
        const draggingRect = draggingElement.getBoundingClientRect()
        const targetRect = li.getBoundingClientRect()
        if (draggingRect.top < targetRect.top) {
          li.parentNode.insertBefore(draggingElement, li.nextSibling)
        } else {
          li.parentNode.insertBefore(draggingElement, li)
        }
      }
    })

    li.addEventListener('dragend', () => {
      draggingElement.classList.remove('dragging')
      draggingElement = null
      updateTabIndices()
    })

    return li
  }

  function updateTabIndices() {
    Array.from(tabList.children).forEach((li, index) => {
      li.setAttribute('data-index', index)
    })
  }

  function saveTabs() {
    Array.from(tabList.children).forEach((li, index) => {
      const tabId = parseInt(li.getAttribute('data-id'))
      chrome.tabs.move(tabId, { index: index })
    })
    window.close()
  }

  chrome.tabs.query({ currentWindow: true }, (loadedTabs) => {
    tabs = loadedTabs
    tabs.forEach((tab, index) => {
      const tabElement = createTabElement(tab, index)
      tabList.appendChild(tabElement)
    })
  })

  saveButton.addEventListener('click', saveTabs)
})
