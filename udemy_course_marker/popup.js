/**
 * Udemy Course Marker Extension
 * Author: Santhosh Kumar Reddy
 */

document.addEventListener('DOMContentLoaded', function() {

  const markAllBtn = document.getElementById('markAllBtn');
  const expandBtn = document.getElementById('expandBtn');
  const uncheckBtn = document.getElementById('uncheckBtn');
  const statusElem = document.getElementById('status');
  const tabSelector = document.getElementById('tabSelector');
  const refreshTabsBtn = document.getElementById('refreshTabsBtn');
  const openUdemyBtn = document.getElementById('openUdemyBtn');
  const progressBar = document.getElementById('progressBar');
  const themeToggle = document.getElementById('themeToggle');
  

  const completionSummary = document.getElementById('completionSummary');
  const summaryTitle = document.getElementById('summaryTitle');
  const summaryVideosCount = document.getElementById('summaryVideosCount');
  const summaryTimeValue = document.getElementById('summaryTimeValue');
  const closeModalButtons = document.querySelectorAll('.close-modal, .close-modal-btn');
  

  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  const activityLog = document.getElementById('activityLog');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  

  const statsContainer = document.getElementById('statsContainer');
  const expandedSections = document.getElementById('expandedSections');
  const uncheckedVideos = document.getElementById('uncheckedVideos');
  const checkedVideos = document.getElementById('checkedVideos');
  const helpToggle = document.getElementById('helpToggle');
  const helpDetails = document.getElementById('helpDetails');
  

  const autoExpandSetting = document.getElementById('autoExpandSetting');
  const autoUncheckSetting = document.getElementById('autoUncheckSetting');
  const skipCompletedSetting = document.getElementById('skipCompletedSetting');
  const delaySlider = document.getElementById('delaySlider');
  const delayValue = document.getElementById('delayValue');
  

  let settings = {
    autoExpand: true,
    autoUncheck: true,
    skipCompleted: false,
    processingDelay: 1000,
    theme: 'dark' // Default to dark theme now
  };
  

  let activityHistory = [];
  

  let currentTabId = null;
  

  function init() {
    loadSettings();
    loadActivityHistory();
    refreshTabs();
    checkTheme();
    updateActivityLog();
    

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        switchTab(tabName);
      });
    });
    

    delaySlider.addEventListener('input', function() {
      delayValue.textContent = this.value + 'ms';
      settings.processingDelay = parseInt(this.value);
      saveSettings();
    });
    

    autoExpandSetting.addEventListener('change', function() {
      settings.autoExpand = this.checked;
      saveSettings();
    });
    
    autoUncheckSetting.addEventListener('change', function() {
      settings.autoUncheck = this.checked;
      saveSettings();
    });
    
    skipCompletedSetting.addEventListener('change', function() {
      settings.skipCompleted = this.checked;
      saveSettings();
    });
    

    themeToggle.addEventListener('click', toggleTheme);
    

    clearHistoryBtn.addEventListener('click', clearHistory);
    

    helpToggle.addEventListener('click', function(e) {
      e.preventDefault();
      if (helpDetails.style.display === 'none') {
        helpDetails.style.display = 'block';
        helpToggle.textContent = 'Less tips';
      } else {
        helpDetails.style.display = 'none';
        helpToggle.textContent = 'More tips';
      }
    });


    markAllBtn.addEventListener('click', function() {
      executeScript('markAll');
    });
    

    expandBtn.addEventListener('click', function() {
      executeScript('expandSections');
    });
    

    uncheckBtn.addEventListener('click', function() {
      executeScript('uncheckVideos');
    });
    

    refreshTabsBtn.addEventListener('click', refreshTabs);
    

    openUdemyBtn.addEventListener('click', function() {
      chrome.tabs.create({ url: 'https://www.udemy.com/' });
    });
    

    tabSelector.addEventListener('change', function() {
      currentTabId = this.value ? parseInt(this.value) : null;
      updateCurrentCourseDisplay();
    });


    closeModalButtons.forEach(button => {
      button.addEventListener('click', function() {
        completionSummary.style.display = 'none';
      });
    });
  }
  

  function switchTab(tabName) {
    tabs.forEach(t => {
      t.classList.remove('active');
      if (t.getAttribute('data-tab') === tabName) {
        t.classList.add('active');
      }
    });
    
    tabContents.forEach(content => {
      content.classList.remove('active');
      if (content.id === tabName + '-tab') {
        content.classList.add('active');
      }
    });
  }
  

  function toggleTheme() {
    if (document.body.getAttribute('data-theme') === 'dark') {
      document.body.removeAttribute('data-theme');
      themeToggle.textContent = 'dark_mode';
      settings.theme = 'light';
    } else {
      document.body.setAttribute('data-theme', 'dark');
      themeToggle.textContent = 'light_mode';
      settings.theme = 'dark';
    }
    saveSettings();
  }
  

  function checkTheme() {
    if (settings.theme === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
      themeToggle.textContent = 'light_mode';
    } else {
      document.body.removeAttribute('data-theme');
      themeToggle.textContent = 'dark_mode';
    }
  }
  

  function loadSettings() {
    chrome.storage.local.get('settings', function(data) {
      if (data.settings) {
        settings = {...settings, ...data.settings}; // Maintain dark theme default
        autoExpandSetting.checked = settings.autoExpand;
        autoUncheckSetting.checked = settings.autoUncheck;
        skipCompletedSetting.checked = settings.skipCompleted;
        delaySlider.value = settings.processingDelay;
        delayValue.textContent = settings.processingDelay + 'ms';
      }
    });
  }
  

  function saveSettings() {
    chrome.storage.local.set({ 'settings': settings });
  }
  

  function addToHistory(action, status) {
    const entry = {
      action,
      status,
      timestamp: new Date().toISOString(),
      courseTitle: tabSelector.options[tabSelector.selectedIndex]?.text || 'Unknown Course'
    };
    
    activityHistory.unshift(entry);
    if (activityHistory.length > 20) {
      activityHistory.pop();
    }
    
    chrome.storage.local.set({ 'activityHistory': activityHistory });
    updateActivityLog();
  }
  

  function loadActivityHistory() {
    chrome.storage.local.get('activityHistory', function(data) {
      if (data.activityHistory) {
        activityHistory = data.activityHistory;
        updateActivityLog();
      }
    });
  }
  

  function updateActivityLog() {
    if (activityHistory.length === 0) {
      activityLog.innerHTML = `
        <div class="empty-state">
          <span class="material-icons">history</span>
          <p>No recent activity</p>
        </div>
      `;
      return;
    }
    
    let html = '';
    activityHistory.forEach(entry => {
      const date = new Date(entry.timestamp);
      const timeString = date.toLocaleString();
      
      html += `
        <div class="log-entry">
          <div><strong>${entry.action}</strong> - <span class="badge ${entry.status.toLowerCase()}">${entry.status}</span></div>
          <div class="course-title">${entry.courseTitle}</div>
          <div class="log-time">${timeString}</div>
        </div>
      `;
    });
    
    activityLog.innerHTML = html;
  }
  

  function clearHistory() {
    activityHistory = [];
    chrome.storage.local.set({ 'activityHistory': [] });
    updateActivityLog();
  }
  

  function updateStatus(message, type = '') {
    statusElem.textContent = message;
    statusElem.className = 'status';
    if (type) {
      statusElem.classList.add('text-' + type);
    }
  }
  

  function updateProgress(percent) {
    progressBar.style.width = percent + '%';
    const progressText = progressBar.querySelector('.progress-text');
    if (progressText) {
      progressText.textContent = percent + '%';
    }
  }
  

  function refreshTabs() {
    chrome.tabs.query({url: ["*://*.udemy.com/*"]}, function(tabs) {
      populateTabSelector(tabs);
    });
  }
  

  function populateTabSelector(tabs) {
    const tabSelector = document.getElementById('tabSelector');
    const currentCourseDisplay = document.getElementById('currentCourseDisplay');
    tabSelector.innerHTML = '';
    
    if (tabs.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No Udemy tabs found';
      tabSelector.appendChild(option);
      currentCourseDisplay.innerHTML = '<div class="empty-course">No courses found</div>';
      document.getElementById('markAllBtn').disabled = true;
      document.getElementById('expandBtn').disabled = true;
      document.getElementById('uncheckBtn').disabled = true;
      return;
    }
    
    document.getElementById('markAllBtn').disabled = false;
    document.getElementById('expandBtn').disabled = false;
    document.getElementById('uncheckBtn').disabled = false;
    
    tabs.forEach(tab => {
      const option = document.createElement('option');
      option.value = tab.id;
      

      let title = tab.title.replace(' | Udemy', '').replace(' | Udemy Business', '');
      

      if (title.length > 40) {
        title = title.substring(0, 38) + '...';
      }
      
      option.textContent = title;
      option.title = tab.title.replace(' | Udemy', '').replace(' | Udemy Business', ''); // Full title on hover
      tabSelector.appendChild(option);
    });
    

    if (!currentTabId && tabs.length > 0) {
      currentTabId = tabs[0].id;
      tabSelector.value = currentTabId;
    } else if (currentTabId) {

      const tabExists = tabs.some(tab => tab.id === currentTabId);
      if (tabExists) {
        tabSelector.value = currentTabId;
      } else if (tabs.length > 0) {
        currentTabId = tabs[0].id;
        tabSelector.value = currentTabId;
      }
    }
    

    updateCurrentCourseDisplay();
  }
  

  function updateCurrentCourseDisplay() {
    const currentCourseDisplay = document.getElementById('currentCourseDisplay');
    const tabSelector = document.getElementById('tabSelector');
    
    if (tabSelector.selectedIndex === -1 || tabSelector.value === '') {
      currentCourseDisplay.innerHTML = '<div class="empty-course">No course selected</div>';
      return;
    }
    
    const selectedOption = tabSelector.options[tabSelector.selectedIndex];
    const fullTitle = selectedOption.title || selectedOption.textContent;
    

    currentCourseDisplay.innerHTML = `Course: ${fullTitle}`;
  }
  

  async function executeScript(scriptType) {
    if (!currentTabId) {
      updateStatus('Please select a course tab first', 'error');
      addToHistory(scriptType === 'markAll' ? 'Mark All Videos' : 
                   scriptType === 'expandSections' ? 'Expand All Sections' : 
                   'Uncheck All Videos', 'Error');
      return;
    }
    
    let totalSections = 0;
    let totalVideos = 0;
    let expandedSectionsCount = 0;
    let uncheckedVideosCount = 0;
    let checkedVideosCount = 0;
    
    try {

      let courseDetailsResult = await chrome.scripting.executeScript({
        target: { tabId: currentTabId },
        func: () => {

          if (!window.location.href.includes('udemy.com/course/')) {
            return { error: 'Not a Udemy course page. Please navigate to a course.' };
          }
          

          const courseTitleElement = document.querySelector('h1');
          const courseTitle = courseTitleElement ? courseTitleElement.textContent.trim() : 'Unknown Course';
          

          function getCourseTimeFromCurriculum() {
            const curriculumStats = document.querySelector('[data-purpose="curriculum-stats"]');
            if (curriculumStats) {
              const timeText = curriculumStats.textContent;

              const hoursMatch = timeText.match(/(\d+(?:\.\d+)?)\s*hours?/i);
              if (hoursMatch && hoursMatch[1]) {
                const hours = parseFloat(hoursMatch[1]);
                const hoursInt = Math.floor(hours);
                const minutes = Math.round((hours - hoursInt) * 60);
                return `${hoursInt.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
              }
            }
            return null;
          }
          

          function getCourseTimeFromContentHeader() {
            const totalLengthElement = document.querySelector('.curriculum-header-length');
            if (totalLengthElement) {
              const lengthText = totalLengthElement.textContent.trim();
              const timeText = lengthText.replace('total length', '').trim();

              if (timeText.includes('hr') || timeText.includes('min')) {
                const hoursMatch = timeText.match(/(\d+)\s*hr/i);
                const minutesMatch = timeText.match(/(\d+)\s*min/i);
                const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
                const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
              }
              return timeText;
            }
            return null;
          }
          

          function calculateFromLectureDurations() {
            const lectureDurations = Array.from(document.querySelectorAll('.curriculum-item-link--duration'));
            if (lectureDurations.length > 0) {
              let totalMinutes = 0;
              
              lectureDurations.forEach(durationElem => {
                const durationText = durationElem.textContent.trim();

                const timeParts = durationText.split(':').map(Number);
                
                if (timeParts.length === 2) {

                  totalMinutes += timeParts[0] + (timeParts[1] / 60);
                } else if (timeParts.length === 3) {

                  totalMinutes += (timeParts[0] * 60) + timeParts[1] + (timeParts[2] / 60);
                }
              });
              
              const hours = Math.floor(totalMinutes / 60);
              const minutes = Math.round(totalMinutes % 60);
              return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }
            return null;
          }
          

          let totalCourseTime = getCourseTimeFromCurriculum() || 
                               getCourseTimeFromContentHeader() || 
                               calculateFromLectureDurations() || 
                               '00:00';
          

          console.log('Course time detection methods:');
          console.log('Method 1 (Curriculum stats):', getCourseTimeFromCurriculum());
          console.log('Method 2 (Content header):', getCourseTimeFromContentHeader());
          console.log('Method 3 (Sum of lectures):', calculateFromLectureDurations());
          console.log('Final time used:', totalCourseTime);
          
          return { courseTitle, totalCourseTime };
        }
      });
      
      const courseDetails = courseDetailsResult[0].result;
      
      if (courseDetails.error) {
        updateStatus(courseDetails.error, 'error');
        addToHistory(scriptType === 'markAll' ? 'Mark All Videos' : 
                     scriptType === 'expandSections' ? 'Expand All Sections' : 
                     'Uncheck All Videos', 'Error');
        return;
      }
      
      resetStats();
      updateProgress(0);
      
      switch(scriptType) {
        case 'markAll':
          updateStatus('Processing course lectures...', 'warning');
          
          if (settings.autoExpand) {

            await chrome.scripting.executeScript({
              target: { tabId: currentTabId },
              func: expandAllSections,
              args: [settings.processingDelay, settings.skipCompleted]
            }).then(result => {
              if (result && result[0] && result[0].result) {
                expandedSectionsCount = result[0].result.expandedCount || 0;
                totalSections = result[0].result.totalSections || 0;
              }
            });
            
            updateProgress(Math.floor((totalSections > 0 ? expandedSectionsCount / totalSections : 0) * 30));
          }
          
          if (settings.autoUncheck) {

            await chrome.scripting.executeScript({
              target: { tabId: currentTabId },
              func: uncheckAllVideos,
              args: [settings.processingDelay]
            }).then(result => {
              if (result && result[0] && result[0].result) {
                uncheckedVideosCount = result[0].result.uncheckedCount || 0;
                totalVideos = result[0].result.totalVideos || 0;
              }
            });
            
            updateProgress(Math.floor(30 + (totalVideos > 0 ? uncheckedVideosCount / totalVideos : 0) * 30));
          }
          

          updateStatus('Marking videos as watched...', 'warning');
          
          const markResult = await chrome.scripting.executeScript({
            target: { tabId: currentTabId },
            func: markAllAsWatched,
            args: [settings.processingDelay]
          });
          
          console.log("Mark result:", markResult);
          
          if (markResult && markResult[0] && markResult[0].result) {
            checkedVideosCount = markResult[0].result.checkedCount || 0;
            totalVideos = markResult[0].result.totalVideos || 0;
            console.log(`Marked ${checkedVideosCount} of ${totalVideos} videos`);
          }
          
          updateProgress(100);
          updateStatus(`Marked ${checkedVideosCount} videos as watched!`, 'success');
          updateStats(expandedSectionsCount, uncheckedVideosCount, checkedVideosCount);
          

          addToHistory('Mark All Videos', 'Success');
          

          showConfetti();
          

          if (checkedVideosCount > 0 || totalVideos > 0) {
            setTimeout(() => {

              const finalVideoCount = totalVideos > 0 ? totalVideos : checkedVideosCount;
              

              const timeMatch = courseDetails.totalCourseTime.match(/(\d+):(\d+)/);
              const hours = timeMatch ? parseInt(timeMatch[1]) : 0;
              const minutes = timeMatch ? parseInt(timeMatch[2]) : 0;
              const totalMinutes = (hours * 60) + minutes;
              

              const formattedTime = formatTime(totalMinutes);
              
              showCompletionPopup(courseDetails.courseTitle, finalVideoCount, formattedTime);
            }, 800);
          }
          break;
          
        case 'expandSections':
          updateStatus('Expanding all sections...', 'warning');
          
          await chrome.scripting.executeScript({
            target: { tabId: currentTabId },
            func: expandAllSections,
            args: [settings.processingDelay, settings.skipCompleted]
          }).then(result => {
            if (result && result[0] && result[0].result) {
              expandedSectionsCount = result[0].result.expandedCount || 0;
              totalSections = result[0].result.totalSections || 0;
            }
          });
          
          updateProgress(100);
          updateStatus(`Expanded ${expandedSectionsCount} section(s)!`, 'success');
          updateStats(expandedSectionsCount, 0, 0);
          

          addToHistory('Expand All Sections', 'Success');
          break;
          
        case 'uncheckVideos':
          updateStatus('Unchecking all videos...', 'warning');
          
          await chrome.scripting.executeScript({
            target: { tabId: currentTabId },
            func: uncheckAllVideos,
            args: [settings.processingDelay]
          }).then(result => {
            if (result && result[0] && result[0].result) {
              uncheckedVideosCount = result[0].result.uncheckedCount || 0;
              totalVideos = result[0].result.totalVideos || 0;
            }
          });
          
          updateProgress(100);
          updateStatus(`Unchecked ${uncheckedVideosCount} video(s)!`, 'success');
          updateStats(0, uncheckedVideosCount, 0);
          

          addToHistory('Uncheck All Videos', 'Success');
          break;
      }
    } catch (error) {
      console.error('Error executing script:', error);
      updateStatus('Error: ' + (error.message || 'Unknown error'), 'error');
      

      addToHistory(scriptType === 'markAll' ? 'Mark All Videos' : 
                   scriptType === 'expandSections' ? 'Expand All Sections' : 
                   'Uncheck All Videos', 'Error');
    }
  }
  

  chrome.runtime.onMessage.addListener((message) => {
    try {
      if (message.action === 'udemyTabUpdated') {
        refreshTabs();
      }
      
      if (message.action === 'progressUpdate') {
        updateProgress(message.progress);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
    
    return true;
  });
  

  function showConfetti() {
    const container = document.querySelector('.container');
    

    const colors = ['#a435f0', '#5624d0', '#f5c252', '#ec5252', '#007791', '#00c3a5', '#28a745', '#f0ad4e'];
    const confettiCount = 50; // Reduced count to not overwhelm the UI
    

    document.querySelectorAll('.confetti:not(.confetti-burst)').forEach(c => c.remove());
    

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      

      const containerRect = container.getBoundingClientRect();
      const startX = containerRect.left + Math.random() * containerRect.width;
      const startY = containerRect.top;
      
      confetti.style.left = `${startX}px`;
      confetti.style.top = `${startY}px`;
      

      const color = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.backgroundColor = color;
      

      const size = Math.random() * 10 + 5;
      confetti.style.width = `${size}px`;
      confetti.style.height = `${size}px`;
      

      const angle = Math.random() * Math.PI; // Angle between 0 and PI (downward)
      const velocity = 3 + Math.random() * 8;
      const distance = containerRect.height * (0.6 + Math.random() * 0.3); // Keep confetti within container
      

      confetti.animate(
        [
          { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 0.7 },
          { 
            transform: `translate(
              ${Math.cos(angle) * velocity * 10}px, 
              ${distance}px
            ) rotate(${Math.random() * 360}deg)`,
            opacity: 0
          }
        ],
        {
          duration: 800 + Math.random() * 1000,
          easing: 'cubic-bezier(0.15, 0.5, 0.5, 0.85)',
          fill: 'forwards'
        }
      );
      

      const shapeType = Math.floor(Math.random() * 4);
      if (shapeType === 0) {

      } else if (shapeType === 1) {

        confetti.style.borderRadius = '50%';
      } else if (shapeType === 2) {

        confetti.style.width = '0';
        confetti.style.height = '0';
        confetti.style.backgroundColor = 'transparent';
        confetti.style.borderLeft = `${size/2}px solid transparent`;
        confetti.style.borderRight = `${size/2}px solid transparent`;
        confetti.style.borderBottom = `${size}px solid ${color}`;
      } else {

        confetti.style.backgroundColor = color;
        confetti.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
      }
      
      document.body.appendChild(confetti);
      

      setTimeout(() => {
        if (confetti.parentNode) {
          confetti.parentNode.removeChild(confetti);
        }
      }, 2000);
    }
  }
  

  function updateStats(expanded, unchecked, checked) {
    expandedSections.textContent = expanded;
    uncheckedVideos.textContent = unchecked;
    checkedVideos.textContent = checked;
    statsContainer.style.display = 'grid';
  }
  

  function resetStats() {
    expandedSections.textContent = '0';
    uncheckedVideos.textContent = '0';
    checkedVideos.textContent = '0';
  }
  

  function expandAllSections(delay, skipCompleted) {

    const sectionButtons = Array.from(document.querySelectorAll('.ud-accordion-panel-heading:not(.ud-accordion-panel--expanded)'));
    const totalSections = sectionButtons.length;
    let expandedCount = 0;
    
    if (totalSections === 0) {
      return { expandedCount, totalSections };
    }
    

    for (let i = 0; i < sectionButtons.length; i++) {
      const button = sectionButtons[i];
      if (skipCompleted) {

        const completedBadge = button.querySelector('.ud-badge-bestseller, .ud-badge-success');
        if (completedBadge && completedBadge.textContent.includes('Completed')) {
          continue;
        }
      }
      
      setTimeout(() => {
        button.click();
        expandedCount++;
      }, i * delay / 5);
    }
    
    return { expandedCount: sectionButtons.length, totalSections };
  }
  
  function uncheckAllVideos(delay) {

    const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));
    const totalVideos = document.querySelectorAll('input[type="checkbox"]').length;
    let uncheckedCount = 0;
    
    if (checkboxes.length === 0) {
      return { uncheckedCount, totalVideos };
    }
    

    for (let i = 0; i < checkboxes.length; i++) {
      setTimeout(() => {
        checkboxes[i].click();
        uncheckedCount++;
      }, i * delay / 5);
    }
    
    return { uncheckedCount: checkboxes.length, totalVideos };
  }
  
  function markAllAsWatched(delay) {
    console.log('Starting to mark all videos...');
    

    const sectionHeaders = document.querySelectorAll('.ud-accordion-panel-heading:not(.ud-accordion-panel--expanded)');
    const sectionsCount = sectionHeaders.length;
    
    for (let i = 0; i < sectionsCount; i++) {
      setTimeout(() => {
        sectionHeaders[i].click();
      }, i * 300);
    }
    

    return new Promise(resolve => {
      setTimeout(() => {
        console.log('All sections expanded, now marking videos...');
        

        const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]:not(:checked)'));
        const totalCheckboxes = document.querySelectorAll('input[type="checkbox"]').length;
        let checkedCount = 0;
        
        if (checkboxes.length === 0) {
          console.log('No checkboxes to mark or all already marked');
          resolve({ checkedCount: 0, totalVideos: totalCheckboxes });
          return;
        }
        
        console.log(`Found ${checkboxes.length} checkboxes to mark out of ${totalCheckboxes} total`);
        

        for (let i = 0; i < checkboxes.length; i++) {
          setTimeout(() => {
            try {

              checkboxes[i].disabled = false;
              

              checkboxes[i].click();
              
              checkedCount++;
              console.log(`Marked video ${i+1}/${checkboxes.length}`);
              

              if (i === checkboxes.length - 1) {
                console.log(`Completed marking videos: ${checkedCount}/${totalCheckboxes}`);
                resolve({ checkedCount, totalVideos: totalCheckboxes });
              }
            } catch (e) {
              console.error(`Error marking video ${i+1}:`, e);
            }
          }, i * (delay / 3));
        }
      }, sectionsCount * 300 + 500); // Wait for all sections to expand
    });
  }
  

  function showCompletionPopup(courseTitle, videosCount, courseTime) {

    summaryTitle.textContent = courseTitle;
    summaryVideosCount.textContent = videosCount;
    

    const timeMatch = courseTime.match(/(\d+):(\d+)/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      
      if (hours > 0 && minutes > 0) {
        summaryTimeValue.textContent = `${hours}h ${minutes}m`;
      } else if (hours > 0) {
        summaryTimeValue.textContent = `${hours} hours`;
      } else {
        summaryTimeValue.textContent = `${minutes} minutes`;
      }
    } else {
      summaryTimeValue.textContent = courseTime;
    }
    

    const modalContent = document.querySelector('.summary-modal');
    modalContent.querySelectorAll('.confetti').forEach(c => c.remove());
    

    createConfettiEffect(modalContent, 20);
    

    completionSummary.style.display = 'flex';
    

    const closeModalBtn = document.querySelector('.close-modal-btn');
    

    const newCloseBtn = closeModalBtn.cloneNode(true);
    closeModalBtn.parentNode.replaceChild(newCloseBtn, closeModalBtn);
    

    newCloseBtn.addEventListener('click', function() {

      completionSummary.style.display = 'none';
      

      const rect = this.getBoundingClientRect();
      const buttonCenterX = rect.left + rect.width / 2;
      const buttonTop = rect.top;
      

      createConfettiBurst(buttonCenterX, buttonTop);
    });
  }
  

  function createConfettiEffect(container, count) {
    const colors = ['#a435f0', '#5624d0', '#f5c252', '#ec5252', '#007791'];
    
    for (let i = 0; i < count; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.position = 'absolute';
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.top = `${Math.random() * 100}%`;
      confetti.style.opacity = '0';
      

      const color = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.backgroundColor = color;
      

      const size = Math.random() * 8 + 4;
      confetti.style.width = `${size}px`;
      confetti.style.height = `${size}px`;
      

      const shapeType = Math.floor(Math.random() * 3);
      if (shapeType === 0) {

      } else if (shapeType === 1) {

        confetti.style.borderRadius = '50%';
      } else {

        confetti.style.width = '0';
        confetti.style.height = '0';
        confetti.style.backgroundColor = 'transparent';
        confetti.style.borderLeft = `${size/2}px solid transparent`;
        confetti.style.borderRight = `${size/2}px solid transparent`;
        confetti.style.borderBottom = `${size}px solid ${color}`;
      }
      
      container.appendChild(confetti);
      

      confetti.animate(
        [
          { opacity: 0, transform: 'scale(0) rotate(0deg)' },
          { opacity: 1, transform: 'scale(1) rotate(180deg)' },
          { opacity: 0.8, transform: 'scale(0.9) rotate(270deg)' },
          { opacity: 1, transform: 'scale(1) rotate(360deg)' }
        ],
        {
          duration: 3000 + Math.random() * 2000,
          iterations: Infinity,
          direction: 'alternate',
          easing: 'ease-in-out'
        }
      );
    }
  }
  

  function createConfettiBurst(x, y) {
    const container = document.body;
    const colors = ['#a435f0', '#5624d0', '#f5c252', '#ec5252', '#007791', '#00c3a5', '#28a745', '#f0ad4e'];
    const confettiCount = 150; // More confetti for the burst
    

    document.querySelectorAll('.confetti-burst').forEach(c => c.remove());
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti confetti-burst';
      confetti.style.position = 'fixed';
      confetti.style.left = `${x}px`;
      confetti.style.top = `${y}px`;
      confetti.style.zIndex = '9999';
      

      const color = colors[Math.floor(Math.random() * colors.length)];
      

      const size = Math.random() * 12 + 5;
      confetti.style.width = `${size}px`;
      confetti.style.height = `${size}px`;
      

      const shapeType = Math.floor(Math.random() * 4);
      if (shapeType === 0) {

        confetti.style.backgroundColor = color;
      } else if (shapeType === 1) {

        confetti.style.backgroundColor = color;
        confetti.style.borderRadius = '50%';
      } else if (shapeType === 2) {

        confetti.style.width = '0';
        confetti.style.height = '0';
        confetti.style.backgroundColor = 'transparent';
        confetti.style.borderLeft = `${size/2}px solid transparent`;
        confetti.style.borderRight = `${size/2}px solid transparent`;
        confetti.style.borderBottom = `${size}px solid ${color}`;
      } else {

        confetti.style.backgroundColor = color;
        confetti.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
      }
      

      container.appendChild(confetti);
      

      const angle = Math.random() * Math.PI * 2; // Full 360 degrees
      const velocity = 5 + Math.random() * 15;
      const distance = 100 + Math.random() * 300;
      

      confetti.animate(
        [
          { 
            transform: 'translate(-50%, -50%) scale(0.3) rotate(0deg)',
            opacity: 0.3
          },
          { 
            transform: `translate(
              ${Math.cos(angle) * distance}px, 
              ${Math.sin(angle) * distance - 100}px
            ) scale(1) rotate(${Math.random() * 720}deg)`,
            opacity: 1
          },
          { 
            transform: `translate(
              ${Math.cos(angle) * distance * 1.5}px, 
              ${Math.sin(angle) * distance * 1.5}px
            ) scale(0.5) rotate(${Math.random() * 1440}deg)`,
            opacity: 0
          }
        ],
        {
          duration: 1500 + Math.random() * 1000,
          easing: 'cubic-bezier(0.1, 0.8, 0.2, 1)',
          fill: 'forwards'
        }
      );
      

      setTimeout(() => {
        if (confetti.parentNode) {
          confetti.parentNode.removeChild(confetti);
        }
      }, 2500);
    }
  }
  

  function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
  

  init();
}); 
