document.addEventListener('DOMContentLoaded', () => {
  const tabList = document.getElementById('tabList')
  const saveButton = document.getElementById('saveButton')
  let tabs = []
  let draggingElement = null
  let dropIndicator = document.createElement('div')
  dropIndicator.className = 'drop-indicator'
  document.body.appendChild(dropIndicator)

  function getDragAfterElement(container, y) {
    const draggableElements = [
      ...container.querySelectorAll('li:not(.dragging)'),
    ]

    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect()
        const offset = y - box.top - box.height / 2

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child }
        } else {
          return closest
        }
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element
  }

  function updateDropIndicatorPosition(y) {
    const afterElement = getDragAfterElement(tabList, y)
    if (afterElement) {
      dropIndicator.style.top = `${afterElement.getBoundingClientRect().top}px`
    } else {
      const lastElement = tabList.querySelector('li:last-child')
      if (lastElement) {
        dropIndicator.style.top = `${
          lastElement.getBoundingClientRect().bottom
        }px`
      }
    }
    dropIndicator.style.display = 'block'
    return afterElement
  }

  function createTabElement(tab, index) {
    const li = document.createElement('li')

    // Create the image element
    const img = document.createElement('img')
    img.className = 'favicon'
    img.src = tab.favIconUrl || 'favicon.ico'
    img.alt = 'Favicon'

    // Create the span for the title
    const span = document.createElement('span')
    span.className = 'tab-title'
    span.textContent = tab.title

    // Clear any existing content and append the new elements
    li.textContent = ''
    li.appendChild(img)
    li.appendChild(span)

    li.draggable = true
    li.setAttribute('data-id', tab.id)
    li.setAttribute('data-index', index)

    li.addEventListener('dragstart', (e) => {
      draggingElement = li
      requestAnimationFrame(() => {
        li.classList.add('dragging')
        dropIndicator.style.display = 'none'
      })
    })

    return li
  }

  tabList.addEventListener('dragover', (e) => {
    e.preventDefault()
    if (!draggingElement) return

    const afterElement = updateDropIndicatorPosition(e.clientY)

    if (afterElement === null) {
      tabList.appendChild(draggingElement)
    } else {
      tabList.insertBefore(draggingElement, afterElement)
    }
  })

  tabList.addEventListener('dragend', (e) => {
    if (draggingElement) {
      draggingElement.classList.remove('dragging')
      draggingElement = null
      dropIndicator.style.display = 'none'
      updateTabIndices()
    }
  })

  // Handle the case when dragging outside the list
  document.addEventListener('dragover', (e) => {
    e.preventDefault()
    if (!draggingElement) return

    const listRect = tabList.getBoundingClientRect()
    if (e.clientY > listRect.bottom) {
      // If dragging below the list
      dropIndicator.style.top = `${listRect.bottom}px`
      dropIndicator.style.display = 'block'
      if (draggingElement !== tabList.lastElementChild) {
        tabList.appendChild(draggingElement)
      }
    } else if (e.clientY < listRect.top) {
      // If dragging above the list
      dropIndicator.style.top = `${listRect.top}px`
      dropIndicator.style.display = 'block'
      if (draggingElement !== tabList.firstElementChild) {
        tabList.insertBefore(draggingElement, tabList.firstElementChild)
      }
    }
  })

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
