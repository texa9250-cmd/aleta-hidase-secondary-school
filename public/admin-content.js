(function () {
  const $ = id => {
    const node = document.getElementById(id);
    if (node) return node;
    console.warn('admin-content.js: missing element #' + id);
    return document.createElement('div');
  };
  const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Aptitude', 'Geography', 'History', 'Economics', 'Civics'];
  const ACHIEVEMENT_GROUPS = [
    ['exam', 'Top exam scores'],
    ['awards', 'School awards'],
    ['competitions', 'Competition wins'],
    ['community', 'Making a difference']
  ];
  const HERO_SLOTS = [['hero-1', 'Slide 1'], ['hero-2', 'Slide 2'], ['hero-3', 'Slide 3'], ['hero-4', 'Slide 4'], ['hero-5', 'Slide 5']];

  const FACILITY_PAGE_IMAGES = {
    Library: [
      ['cover', 'Page Hero'],
      ['card:reading-hall', 'Reading Hall'],
      ['card:book-collection', 'Book Collection'],
      ['card:reference-section', 'Reference Section'],
      ['card:study-desks', 'Study Desks']
    ],
    'The Beauty of Our School': [
      ['cover', 'Page Hero'],
      ['card:main-garden', 'Main Garden'],
      ['card:green-pathways', 'Green Pathways'],
      ['card:flower-beds', 'Flower Beds'],
      ['card:campus-view', 'Campus View']
    ],
    'Science Labs': [
      ['cover', 'Page Hero'],
      ['card:chemistry-lab', 'Chemistry Lab'],
      ['card:chemicals', 'Chemicals & Reagents'],
      ['card:instruments', 'Instruments & Apparatus'],
      ['card:safety-equipment', 'Safety Equipment']
    ],
    Classrooms: [
      ['cover', 'Page Hero'],
      ['card:grade-9', 'Grade 9 Classroom'],
      ['card:grade-10', 'Grade 10 Classroom'],
      ['card:grade-11', 'Grade 11 Classroom'],
      ['card:grade-12', 'Grade 12 Classroom']
    ]
  };

  let initialized = false, adminPageContentInitialized = false, facilityRows = [], mediaSearchTimer = 0, editingHomeEventId = null;

  const typeName = () => $('uploadType').value;
  const isNewAchievement = () => typeName() === 'achievement-photo' && $('achievementMode').value === 'new';

  const targetKey = () => {
    if (typeName() === 'hero-slider') return $('uploadTarget').value;
    if (typeName() === 'achievement-cover') return 'achievement-main';
    if (typeName() === 'about-page-image') return 'about-main';
    if (typeName() === 'achievement-photo') return `${$('achievementGroup').value}:record:${$('achievementCard').value}`;
    if (typeName() === 'facility-photo') {
      const slot = $('facilityPhotoSlot').value;
      if (!slot) return '';
      return slot === 'gallery' ? $('uploadTarget').value : `${$('uploadTarget').value}:${slot}`;
    }
    return $('uploadTarget').value;
  };

  const destination = () => {
    const type = typeName();
    if (type === 'achievement-photo') {
      if (isNewAchievement()) throw new Error('Create the record first, then choose “Add or replace the photo on an existing card”.');
      if (!$('achievementGroup').value) throw new Error('Choose an achievement section.');
      if (!$('achievementCard').value) throw new Error('Choose the exact achievement card.');
    }
    if (type === 'hero-slider' && !$('uploadTarget').value) throw new Error('Choose a slide to replace.');
    if (!['topic-file', 'achievement-cover', 'achievement-photo', 'about-page-image'].includes(type) && !$('uploadTarget').value) throw new Error('Choose a destination first.');
    if (type === 'facility-photo' && !$('facilityPhotoSlot').value) throw new Error('Choose an image location in the facility page.');
    return {
      type,
      key: targetKey(),
      display_title: type === 'facility-photo' ? $('pageUploadCaption').value.trim() : ''
    };
  };

  function fillTargets() {
    const kind = typeName(), target = $('uploadTarget');
    const isAch = kind === 'achievement-photo', achNew = isNewAchievement();
    const isAchievementCover = kind === 'achievement-cover';
    const isAboutPage = kind === 'about-page-image';

    $('achievementUploadFields').hidden = !isAch;
    $('achievementCardField').hidden = !isAch || achNew;
    $('achievementNewFields').hidden = !isAch || !achNew;
    $('facilitySlotField').hidden = kind !== 'facility-photo';
    target.hidden = isAch || isAchievementCover || isAboutPage;
    $('uploadTargetField').hidden = isAch || isAchievementCover || isAboutPage;
    $('pageUploadCaptionRow').hidden = kind !== 'facility-photo';

    updateAchievementEntryFields();
    $('pageUploadFile').accept = 'image/jpeg,image/png,image/webp';
    const uploadLabel = document.querySelector('label[for="pageUploadFile"] span');
    if (uploadLabel) uploadLabel.textContent = isAch ? 'Achievement image (JPG/PNG/WebP, 10 MB max)' : isAchievementCover ? 'Achievement page cover image (JPG/PNG/WebP, 10 MB max)' : 'Image file (JPG/PNG/WebP, 10 MB max)';

    if (kind === 'hero-slider') {
      populateSelect(target, HERO_SLOTS.map(([value, label]) => ({ value, label })), 'Choose a slide to replace');
    } else if (isAch) {
      const selectedGroup = $('achievementGroup').value;
      populateSelect($('achievementGroup'), ACHIEVEMENT_GROUPS.map(([value]) => ({ value, label: achievementGroupLabel(value) })), 'Choose an achievement section');
      if (ACHIEVEMENT_GROUPS.some(([value]) => value === selectedGroup)) $('achievementGroup').value = selectedGroup;
      if (!achNew) loadAchievementCards();
    } else if (kind === 'facility-photo') {
      const selectedFacilityId = target.value;
      populateSelect(target, facilityRows.map(f => ({ value: String(f.id), label: f.title })), 'Choose a facility page');
      if (facilityRows.some(f => String(f.id) === selectedFacilityId)) target.value = selectedFacilityId;
      fillFacilityPhotoSlots();
    }
    updateDestinationSummary();
    loadFiles().catch(error => say(error.message, false));
  }

  const selectedFacility = () => facilityRows.find(f => String(f.id) === $('uploadTarget').value);

  const targetLabel = () => {
    if (typeName() === 'hero-slider') return $('uploadTarget').selectedOptions[0]?.textContent || '';
    if (typeName() === 'achievement-cover') return 'Our Achievements page → Feature cover image';
    if (typeName() === 'about-page-image') return 'About Page → Main Image';
    if (typeName() === 'achievement-photo') {
      const card = isNewAchievement() ? ($('achievementEntryName').value.trim() || 'new achievement') : ($('achievementCard').selectedOptions[0]?.textContent || '');
      return `${$('achievementGroup').selectedOptions[0]?.textContent || ''} → ${card}`;
    }
    if (typeName() === 'facility-photo') {
      const slot = $('facilityPhotoSlot').selectedOptions[0]?.textContent || '';
      return `${$('uploadTarget').selectedOptions[0]?.textContent || ''} → ${slot}`;
    }
    return $('uploadTarget').selectedOptions[0]?.textContent || '';
  };

  function updateDestinationSummary() {
    const section = $('uploadType').selectedOptions[0]?.textContent || '';
    let details = '';
    if (typeName() === 'hero-slider') {
      details = $('uploadTarget').selectedOptions[0]?.textContent || 'Choose a slide';
    } else if (typeName() === 'achievement-cover') {
      details = 'Our Achievements page → Feature cover image';
    } else if (typeName() === 'about-page-image') {
      details = 'About Page → Main Image';
    } else if (typeName() === 'achievement-photo') {
      const group = $('achievementGroup').value
        ? $('achievementGroup').selectedOptions[0]?.textContent
        : 'Choose an achievement group';
      if (isNewAchievement()) {
        const year = $('achievementEntryYear').value.trim() || 'Enter year';
        const name = $('achievementEntryName').value.trim() || 'Enter name';
        details = `${group} → new record → ${year} → ${name}`;
      } else {
        details = `${group} → ${$('achievementCard').value ? $('achievementCard').selectedOptions[0]?.textContent : 'Choose a card'}`;
      }
    } else if (typeName() === 'facility-photo') {
      const facility = $('uploadTarget').selectedOptions[0]?.textContent;
      const slot = $('facilityPhotoSlot').selectedOptions[0]?.textContent;
      details = [facility, facility ? slot : ''].filter(Boolean).join(' → ');
    } else {
      details = $('uploadTarget').selectedOptions[0]?.textContent || '';
    }
    $('destinationSummary').textContent = details
      ? `Upload destination: ${section} → ${details}`
      : 'Choose the page section, specific card, and image slot (if shown) before assigning an image.';
  }

  const say = (message, ok) => {
    const box = $('pageUploadMsg');
    box.textContent = message;
    box.className = 'msg ' + (ok ? 'good' : 'err');
  };

  async function request(url, options = {}) {
    const token = sessionStorage.getItem('token');
    const response = await fetch(url, {
      ...options,
      headers: { Authorization: 'Bearer ' + token, ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Upload request failed.');
    return data;
  }

  const achievementGroupNames = {
    exam: 'Top exam scores',
    awards: 'School awards',
    competitions: 'Competition wins',
    community: 'Making a difference'
  };
  const achievementPhotoType = file => {
    const extension = file.name.split('.').pop().toLowerCase();
    const fallbackTypes = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
    return file.type || fallbackTypes[extension] || '';
  };

  async function uploadAchievementPhoto(file, entry) {
    const mime = achievementPhotoType(file);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime))
      throw new Error('Choose a JPG, PNG or WebP image.');
    if (file.size > 10 * 1024 * 1024) throw new Error('Images may not exceed 10 MB.');
    return await request('/api/admin/content-assets', {
      method: 'POST',
      headers: {
        'Content-Type': mime,
        'X-Target-Type': 'achievement-photo',
        'X-Target-Key': encodeURIComponent(`${entry.group_name}:record:${entry.id}`),
        'X-File-Name': encodeURIComponent(file.name),
        'X-Display-Title': encodeURIComponent(entry.name)
      },
      body: file
    });
  }

  async function loadAchievementEntries() {
    const list = $('achievementEntryList');
    list.replaceChildren();
    try {
      const entries = await request('/api/achievements?group=all');
      if (!entries.length) {
        list.append(document.createTextNode('No achievement records yet.'));
        return true;
      }
      entries.forEach(entry => {
        const row = document.createElement('div');
        row.className = 'item';
        const info = document.createElement('div');
        const title = document.createElement('h3');
        title.textContent = entry.name;
        const details = document.createElement('div');
        details.className = 'meta';
        const score = entry.group_name === 'exam' ? ` · ${entry.score}/${entry.out_of} · ${entry.stream === 'natural' ? 'Natural Science' : 'Social Science'}` : '';
        details.textContent = `${achievementGroupNames[entry.group_name]} · ${entry.year}${score}`;
        info.append(title, details);
        if (entry.subtitle || entry.result) {
          const extra = document.createElement('div');
          extra.className = 'meta';
          extra.textContent = [entry.subtitle, entry.result].filter(Boolean).join(' · ');
          info.append(extra);
        }
        if (entry.photo) {
          const image = document.createElement('img');
          image.src = entry.photo;
          image.alt = entry.name;
          image.style.cssText = 'display:block;width:120px;height:80px;object-fit:cover;margin-top:.5rem;border-radius:6px';
          info.append(image);
        }
        const actions = document.createElement('div');
        actions.className = 'actions';
        actions.style.marginTop = '0';
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/jpeg,image/png,image/webp';
        fileInput.hidden = true;
        const photoButton = document.createElement('button');
        photoButton.type = 'button';
        photoButton.className = 'ghost';
        photoButton.textContent = entry.photo ? 'Replace image' : 'Add image';
        photoButton.onclick = () => fileInput.click();
        fileInput.onchange = async () => {
          const file = fileInput.files[0];
          if (!file) return;
          photoButton.disabled = true;
          try {
            const saved = await uploadAchievementPhoto(file, entry);
            say(`UPLOAD CONFIRMED — File: ${saved.file_name || file.name}. Destination: Achievements → ${achievementGroupNames[entry.group_name]} → ${entry.name} (${entry.year}). Assignment: achievement-photo / ${saved.target_key}.`, true);
            await loadAchievementEntries();
          } catch (error) {
            say(error.message, false);
          } finally {
            photoButton.disabled = false;
          }
        };
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'danger';
        remove.textContent = 'Delete';
        remove.onclick = async () => {
          if (!confirm(`Delete "${entry.name}" from ${entry.year}?`)) return;
          try {
            await request(`/api/admin/achievements/${encodeURIComponent(entry.id)}`, { method: 'DELETE' });
            say('Achievement record deleted.', true);
            await loadAchievementEntries();
          } catch (error) {
            say(error.message, false);
          }
        };
        actions.append(photoButton, remove, fileInput);
        row.append(info, actions);
        list.append(row);
      });
      return true;
    } catch (error) {
      list.textContent = error.message;
      return false;
    }
  }

  function updateAchievementEntryFields() {
    const group = $('achievementGroup').value, creating = isNewAchievement();
    const isExam = group === 'exam';
    $('achievementScoreFields').hidden = !isExam;
    $('achievementEntryYear').required = creating;
    $('achievementEntryName').required = creating;
    $('achievementEntryStream').required = creating && isExam;
    $('achievementEntryScore').required = creating && isExam;
    $('achievementEntryOutOf').required = creating && isExam;
    $('achievementResultField').hidden = group !== 'competitions';
    const labels = {
      exam: ['Details (optional)', 'ዝርዝር (አማራጭ)'],
      awards: ['Awarding body (optional)', 'ሽልማቱን የሰጠው አካል (አማራጭ)'],
      competitions: ['Competition (optional)', 'ውድድር (አማራጭ)'],
      community: ['Impact (optional)', 'ተጽዕኖ (አማራጭ)']
    }[group] || ['Details (optional)', 'ዝርዝር (አማራጭ)'];
    $('achievementSubtitleLabel').textContent = labels[0];
    $('achievementSubtitleLabel').dataset.en = labels[0];
    $('achievementSubtitleLabel').dataset.am = labels[1];
  }

  function populateSelect(select, rows, placeholder) {
    select.replaceChildren(new Option(placeholder, ''));
    rows.forEach(row => select.add(new Option(row.label, row.value)));
  }

  function fillFacilityPhotoSlots() {
    const select = $('facilityPhotoSlot'), selected = select.value;
    const facility = selectedFacility();
    console.log('[facility slots] facility:', facility, 'prev selection:', selected);

    if (!facility) {
      populateSelect(select, [], 'Choose a facility page first');
      return;
    }

    const pageImages = FACILITY_PAGE_IMAGES[facility?.title] || [];
    const slots = [
      ...pageImages.map(([key, label]) => ({ value: key, label: `Replace ${label} image` })),
      { value: 'gallery', label: 'Add a photo to the facility gallery' }
    ];
    console.log('[facility slots] built slots:', slots);
    populateSelect(select, slots, 'Choose an image location');

    // Never silently choose Gallery or another card. Require the publisher
    // to select the exact image location before uploading.
    if (slots.some(s => s.value === selected)) {
      select.value = selected;
    } else {
      select.value = '';
    }
    console.log('[facility slots] final select.value:', select.value);

    updateDestinationSummary();
  }

  async function loadAchievementCards(keepValue) {
    const group = $('achievementGroup').value, select = $('achievementCard');
    const previous = keepValue === undefined ? select.value : keepValue;
    if (!group) { populateSelect(select, [], 'Choose an achievement section first'); return; }
    try {
      const rows = await fetch(`/api/achievements?group=${encodeURIComponent(group)}`).then(r => r.ok ? r.json() : Promise.reject(new Error('Could not load achievement cards.')));
      populateSelect(select, rows.map(row => ({
        value: row.id,
        label: `${row.name}${row.year ? ` (${row.year})` : ''}${row.photo ? ' — has photo' : ' — no photo yet'}`
      })), rows.length ? 'Choose a specific card' : 'No cards in this section yet — create one first');
      if (rows.some(row => row.id === previous)) select.value = previous;
    } catch (error) { say(error.message, false); }
    updateDestinationSummary();
    loadFiles().catch(error => say(error.message, false));
  }

  function achievementGroupLabel(group) {
    return (typeof ACHIEVEMENTS !== 'undefined' && ACHIEVEMENTS[group]?.title) || achievementGroupNames[group] || group;
  }

  async function createAchievement() {
    const group = $('achievementGroup').value, isExam = group === 'exam';
    const year = $('achievementEntryYear').value.trim(), name = $('achievementEntryName').value.trim();
    if (!group) return say('Choose an achievement section.', false);
    if (!year || !name) return say('Enter the year and the name.', false);
    const photo = $('pageUploadFile').files[0];
    if (photo) {
      const mime = achievementPhotoType(photo);
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) return say('Choose a JPG, PNG or WebP image.', false);
      if (photo.size > 10 * 1024 * 1024) return say('Images may not exceed 10 MB.', false);
    }
    const button = $('pageUploadForm').querySelector('button[type="submit"], button:not([type])');
    if (button) button.disabled = true;
    try {
      const created = await request('/api/admin/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group, year, name,
          subtitle: $('achievementEntrySubtitle').value.trim(),
          result: group === 'competitions' ? $('achievementEntryResult').value.trim() : '',
          note: $('achievementEntryNote').value.trim(),
          stream: isExam ? $('achievementEntryStream').value : '',
          score: isExam ? $('achievementEntryScore').value : null,
          out_of: isExam ? $('achievementEntryOutOf').value : null
        })
      });
      let photoNote = '';
      if (photo) {
        try {
          const saved = await uploadAchievementPhoto(photo, { group_name: group, id: created.id, name });
          photoNote = ` IMAGE UPLOAD CONFIRMED: ${saved.file_name || photo.name} → Achievements → ${achievementGroupNames[group]} → ${name} (${year}); saved assignment: ${saved.target_key}.`;
        } catch (error) {
          photoNote = ` The record was saved, but the image failed: ${error.message} Use “Add image” in the list below.`;
        }
      }
      ['achievementEntryYear', 'achievementEntryName', 'achievementEntrySubtitle', 'achievementEntryResult', 'achievementEntryNote', 'achievementEntryScore', 'pageUploadFile']
        .forEach(id => { $(id).value = ''; });
      say(`Saved “${name}”.${photoNote}`, !photoNote);
      await loadAchievementEntries();
      await loadAchievementCards('');
    } catch (error) {
      say(error.message, false);
    } finally { if (button) button.disabled = false; }
  }

  async function loadFacilities() {
    const response = await fetch('/api/campus/facilities');
    const rows = await response.json().catch(() => null);
    if (!response.ok || !Array.isArray(rows)) throw new Error('Could not load the facilities list.');
    facilityRows = rows.filter(f => f.title.toLowerCase() !== 'computer room');
    console.log('[facilities] loaded:', facilityRows);
  }

  const HOME_EVENT_AM_MONTHS = ['መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'];
  const HOME_EVENT_ETH_FORMAT = new Intl.DateTimeFormat('en-u-ca-ethiopic-nu-latn', {
    year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC'
  });
  function homeEventEthPartsFromIso(iso) {
    const parts = HOME_EVENT_ETH_FORMAT.formatToParts(new Date(`${iso}T00:00:00Z`));
    const value = type => Number(parts.find(part => part.type === type)?.value || 0);
    return { year: value('year'), month: value('month'), day: value('day') };
  }
  function homeEventEthLabelFromIso(iso) {
    const parts = homeEventEthPartsFromIso(iso);
    return `${parts.day} ${HOME_EVENT_AM_MONTHS[parts.month - 1] || ''} ${parts.year}`;
  }
  function homeEventIsoFromEth(year, month, day) {
    year = Number(year); month = Number(month); day = Number(day);
    if (!Number.isInteger(year) || year < 1 || !Number.isInteger(month) || month < 1 || month > 13 || !Number.isInteger(day)) return '';
    const maxDay = month === 13 ? (year % 4 === 3 ? 6 : 5) : 30;
    if (day < 1 || day > maxDay) return '';
    // Find the matching Gregorian date in the Ethiopian year; this avoids hard-coded leap-year offsets.
    const start = Date.UTC(year + 7, 8, 1);
    for (let offset = 0; offset < 390; offset++) {
      const candidate = new Date(start + offset * 86400000);
      const parts = HOME_EVENT_ETH_FORMAT.formatToParts(candidate);
      const value = type => Number(parts.find(part => part.type === type)?.value || 0);
      if (value('year') === year && value('month') === month && value('day') === day) {
        return `${candidate.getUTCFullYear()}-${String(candidate.getUTCMonth() + 1).padStart(2, '0')}-${String(candidate.getUTCDate()).padStart(2, '0')}`;
      }
    }
    return '';
  }
  function refreshHomeEventEthDays(selectedDay = '') {
    const month = Number($('homeEventEthMonth').value);
    const year = Number($('homeEventEthYear').value);
    const maxDay = month === 13 ? (year % 4 === 3 ? 6 : 5) : 30;
    const daySelect = $('homeEventEthDay');
    daySelect.replaceChildren(new Option('ቀን', ''));
    for (let day = 1; day <= (month ? maxDay : 30); day++) daySelect.add(new Option(String(day), String(day)));
    if (selectedDay) daySelect.value = String(selectedDay);
  }
  function setHomeEventEthDate(iso) {
    const parts = homeEventEthPartsFromIso(iso);
    $('homeEventEthYear').value = parts.year || '';
    $('homeEventEthMonth').value = parts.month || '';
    refreshHomeEventEthDays(parts.day);
    syncHomeEventIsoDate();
  }
  function syncHomeEventIsoDate() {
    $('homeEventDate').value = homeEventIsoFromEth($('homeEventEthYear').value, $('homeEventEthMonth').value, $('homeEventEthDay').value);
  }
  function initHomeEventEthDateControls() {
    $('homeEventEthMonth').addEventListener('change', () => { refreshHomeEventEthDays(); syncHomeEventIsoDate(); });
    $('homeEventEthYear').addEventListener('input', () => { refreshHomeEventEthDays($('homeEventEthDay').value); syncHomeEventIsoDate(); });
    $('homeEventEthDay').addEventListener('change', syncHomeEventIsoDate);
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setHomeEventEthDate(todayIso);
  }

  function resetHomeEventForm() {
    editingHomeEventId = null;
    $('homeEventForm').reset();
    const now = new Date();
    setHomeEventEthDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
    $('homeEventSave').textContent = 'Create event card';
    $('homeEventSave').dataset.en = 'Create event card';
    $('homeEventSave').dataset.am = 'የክንውን ካርድ ፍጠር';
    $('homeEventCancel').hidden = true;
    $('eventFormTitle').textContent = 'Create a home page event card';
    $('eventFormTitle').dataset.en = 'Create a home page event card';
    $('eventFormTitle').dataset.am = 'በመነሻ ገጽ ላይ የክንውን ካርድ ፍጠር';
  }

  async function loadHomeEvents() {
    const homeEventRows = await request('/api/admin/home-events');
    const list = $('homeEventListAdmin');
    list.replaceChildren();
    if (!homeEventRows.length) {
      list.textContent = 'No upcoming event cards yet. Create one above.';
    }
    homeEventRows.forEach(event => {
      const row = document.createElement('div');
      row.className = 'item';
      const info = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = event.title;
      info.append(title);
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = [homeEventEthLabelFromIso(event.event_date), event.location, event.description].filter(Boolean).join(' · ');
      info.append(meta);
      const actions = document.createElement('div');
      actions.className = 'actions';
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'ghost';
      edit.textContent = 'Edit';
      edit.onclick = () => {
        editingHomeEventId = event.id;
        $('homeEventTitle').value = event.title;
        setHomeEventEthDate(event.event_date);
        $('homeEventLocation').value = event.location;
        $('homeEventDescription').value = event.description;
        $('homeEventSave').textContent = 'Save changes';
        $('homeEventSave').dataset.en = 'Save changes';
        $('homeEventSave').dataset.am = 'ለውጦቹን አስቀምጥ';
        $('homeEventCancel').hidden = false;
        $('eventFormTitle').textContent = 'Edit home page event card';
        $('eventFormTitle').dataset.en = 'Edit home page event card';
        $('eventFormTitle').dataset.am = 'የመነሻ ገጽ የክንውን ካርድ አስተካክል';
        $('homeEventTitle').focus();
      };
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'danger';
      remove.textContent = 'Delete';
      remove.onclick = async () => {
        if (!confirm(`Delete "${event.title}" and its attached image or PDF?`)) return;
        try {
          await request(`/api/admin/home-events/${encodeURIComponent(event.id)}`, { method: 'DELETE' });
          await loadHomeEvents();
          $('homeEventMsg').textContent = 'Event card deleted.';
          $('homeEventMsg').className = 'msg good';
        } catch (error) {
          $('homeEventMsg').textContent = error.message;
          $('homeEventMsg').className = 'msg err';
        }
      };
      actions.append(edit, remove);
      row.append(info, actions);
      list.append(row);
    });
  }

  function initPageContent() {
    initHomeEventEthDateControls();
    $('homeEventForm').addEventListener('submit', async event => {
      event.preventDefault();
      const body = {
        title: $('homeEventTitle').value.trim(),
        event_date: (syncHomeEventIsoDate(), $('homeEventDate').value),
        location: $('homeEventLocation').value.trim(),
        description: $('homeEventDescription').value.trim()
      };
      try {
        await request(editingHomeEventId
          ? `/api/admin/home-events/${encodeURIComponent(editingHomeEventId)}`
          : '/api/admin/home-events', {
          method: editingHomeEventId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        resetHomeEventForm();
        await loadHomeEvents();
        $('homeEventMsg').textContent = 'Event card saved.';
        $('homeEventMsg').className = 'msg good';
      } catch (error) {
        $('homeEventMsg').textContent = error.message;
        $('homeEventMsg').className = 'msg err';
      }
    });
    $('homeEventCancel').addEventListener('click', resetHomeEventForm);
  }

  function initializeAchievementManagement() {
    loadAchievementEntries();
  }

  function initializeAdminPageContent() {
    if (adminPageContentInitialized) return;
    adminPageContentInitialized = true;
    initializeAchievementManagement();
    initPageContent();
    loadHomeEvents().catch(error => {
      $('homeEventMsg').textContent = error.message;
      $('homeEventMsg').className = 'msg err';
    });
  }

  async function loadFiles() {
    const list = $('pageUploadList'), kind = typeName();
    console.log('[loadFiles] START', {
      kind,
      uploadTargetValue: $('uploadTarget').value,
      facilityPhotoSlotValue: $('facilityPhotoSlot')?.value,
      facilityRowsCount: facilityRows.length
    });
    list.replaceChildren();
    if (kind === 'achievement-photo') {
      if (isNewAchievement()) { list.textContent = 'New records appear in the “Achievement records” list below.'; return; }
      if (!$('achievementCard').value) { list.textContent = 'Choose the exact achievement card to see its photo.'; return; }
    } else if (!['achievement-photo', 'achievement-cover', 'about-page-image'].includes(kind) && !$('uploadTarget').value) {
      list.textContent = 'Choose a destination to see its current files.';
      return;
    }
    try {
      const response = await fetch(`/api/content-assets?target_type=${encodeURIComponent(kind)}`);
      let rows = await response.json();
      console.log('[loadFiles] raw API response for type', kind, ':', rows);
      if (!response.ok || !Array.isArray(rows)) throw new Error('Could not load the uploaded files.');
      if (kind === 'facility-photo') {
        const facility = selectedFacility();
        console.log('[loadFiles] selectedFacility:', facility);
        if (!facility) {
          list.textContent = `Could not find a facility with id "${$('uploadTarget').value}". Try refreshing the page.`;
          return;
        }
        // Show only files assigned to the currently selected image slot.
        // Gallery uploads are stored as facilityId:UUID, so list those separately.
        const selectedSlot = $('facilityPhotoSlot').value;
        const matching = rows.filter(file => {
          if (selectedSlot === 'gallery') {
            return file.target_key.startsWith(`${facility.id}:`)
              && file.target_key !== `${facility.id}:cover`
              && !file.target_key.startsWith(`${facility.id}:card:`);
          }
          return file.target_key === `${facility.id}:${selectedSlot}`;
        });
        console.log('[loadFiles] facility filter:', {
          facilityId: facility.id,
          facilityTitle: facility.title,
          totalAssets: rows.length,
          matchingForFacility: matching.length,
          keysFound: rows.map(r => r.target_key)
        });
        rows = matching;

        try {
          const legacyResponse = await fetch(`/api/campus/facilities/${encodeURIComponent(facility.id)}`);
          const data = await legacyResponse.json().catch(() => null);
          if (legacyResponse.ok && data) {
            const legacyPhotos = (data.photos || [])
              .filter(photo => !photo.url.includes('/api/content-assets/'))
              .map(photo => ({ ...photo, legacyFacilityPhoto: true, file_name: photo.name || 'Facility photo' }));
            console.log('[loadFiles] legacy facility photos:', legacyPhotos.length);
            rows = rows.concat(legacyPhotos);
          } else {
            console.warn('[loadFiles] legacy facility endpoint returned non-OK, skipping legacy photos', legacyResponse.status, data);
          }
        } catch (legacyError) {
          console.warn('[loadFiles] legacy facility fetch threw, skipping legacy photos:', legacyError);
        }

        rows.forEach(file => {
          if (!file.legacyFacilityPhoto) {
            if (file.target_key === `${facility.id}:cover`) file.slot = 'cover';
            else if (file.target_key.startsWith(`${facility.id}:card:`)) file.slot = `card:${file.target_key.split('card:')[1]}`;
            else file.slot = 'gallery';
          }
        });
      } else if (kind === 'hero-slider') {
        rows = rows.filter(file => file.target_key === $('uploadTarget').value);
      } else {
        rows = rows.filter(file => file.target_key === targetKey());
      }
      console.log('[loadFiles] final rows to render:', rows);
      if (!rows.length) {
        list.textContent = 'No files uploaded to this destination yet.';
        return;
      }
      rows.forEach(file => {
        const row = document.createElement('div');
        row.className = 'item';
        const info = document.createElement('div'), label = document.createElement('h3');
        const facility = kind === 'facility-photo' ? selectedFacility() : null;
        const slotLabel = (FACILITY_PAGE_IMAGES[facility?.title] || []).find(([key]) => key === file.slot)?.[1];
        let slot = slotLabel ? `${slotLabel} image` : file.slot === 'gallery' ? 'Gallery photo' : '';
        if (kind === 'hero-slider') slot = 'Hero Image';

        label.textContent = `${slot ? `${slot} · ` : ''}${file.display_title || file.file_name || file.name || 'Uploaded file'}`;
        info.append(label);
        const metadata = document.createElement('div');
        metadata.className = 'meta';
        const sizeText = Number.isFinite(Number(file.file_size))
          ? (Number(file.file_size) >= 1024 * 1024 ? `${(Number(file.file_size) / (1024 * 1024)).toFixed(2)} MB` : `${Math.max(1, Math.round(Number(file.file_size) / 1024))} KB`)
          : '';
        metadata.textContent = [
          `Destination: ${targetLabel()}`,
          `File: ${file.file_name || file.name || 'Unknown file'}`,
          file.target_type ? `Type: ${file.target_type}` : '',
          file.target_key ? `Saved assignment: ${file.target_key}` : '',
          file.mime || '',
          sizeText,
          file.created_at ? `Uploaded: ${file.created_at}` : ''
        ].filter(Boolean).join(' · ');
        info.append(metadata);
        if (file.url) {
          const preview = document.createElement(file.mime === 'application/pdf' ? 'a' : 'img');
          if (preview.tagName === 'IMG') {
            preview.src = file.url;
            preview.alt = file.file_name || file.name || targetLabel();
            preview.style.cssText = 'display:block;width:120px;height:80px;object-fit:cover;margin-top:.5rem;border-radius:6px';
          } else {
            preview.href = file.url; preview.target = '_blank'; preview.rel = 'noopener'; preview.textContent = 'Open PDF';
          }
          info.append(preview);
        }
        const remove = document.createElement('button');
        remove.type = 'button'; remove.className = 'danger'; remove.textContent = file.legacyFacilityPhoto ? 'Delete' : 'Remove here';
        remove.onclick = async () => {
          if (!confirm(file.legacyFacilityPhoto
            ? `Delete "${label.textContent}" from this facility?`
            : `Remove "${label.textContent}" from this destination? The image will remain in the library.`)) return;
          try {
            const endpoint = file.legacyFacilityPhoto ? `/api/campus/admin/photos/${file.id}` : `/api/admin/content-assets/${file.id}`;
            await request(endpoint, { method: 'DELETE' });
            say(file.legacyFacilityPhoto ? 'File deleted.' : 'Image removed from this destination.', true);
            loadFiles();
            loadMediaLibrary();
          } catch (error) { say(error.message, false); }
        };
        row.append(info, remove); list.append(row);
      });
    } catch (error) {
      console.error('[loadFiles] ERROR:', error);
      list.textContent = error.message;
      say(error.message, false);
    }
  }

  async function loadMediaLibrary() {
    const grid = $('mediaLibraryGrid');
    grid.replaceChildren();
    try {
      const query = $('mediaSearch').value.trim();
      const rows = await request(`/api/admin/media?q=${encodeURIComponent(query)}`);
      if (!rows.length) {
        grid.textContent = query ? 'No images match that search.' : 'No images in the library yet. Upload one above.';
        return;
      }
      rows.forEach(media => {
        const card = document.createElement('article');
        card.className = 'media-card';
        const image = document.createElement('img');
        image.src = media.url;
        image.alt = media.display_title || media.file_name;
        image.loading = 'lazy';
        const title = document.createElement('h3');
        title.textContent = media.display_title || media.file_name;
        const details = document.createElement('div');
        details.className = 'meta';
        details.textContent = `${media.file_name} · used on ${media.usage_count} ${media.usage_count === 1 ? 'page' : 'pages'}`;
        const actions = document.createElement('div');
        actions.className = 'actions';
        const use = document.createElement('button');
        use.type = 'button';
        use.textContent = 'Use';
        use.title = 'Use for destination';
        use.setAttribute('aria-label', 'Use for destination');
        use.onclick = () => assignMedia(media, use);
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'danger';
        remove.textContent = 'Delete';
        remove.title = 'Delete everywhere';
        remove.setAttribute('aria-label', 'Delete everywhere');
        remove.onclick = async () => {
          const uses = media.usage_count ? ` It will also be removed from ${media.usage_count} page${media.usage_count === 1 ? '' : 's'}.` : '';
          if (!confirm(`Delete "${media.display_title || media.file_name}" from the library?${uses} This cannot be undone.`)) return;
          remove.disabled = true;
          try {
            await request(`/api/admin/media/${media.id}`, { method: 'DELETE' });
            say('Image deleted from the library.', true);
            await loadMediaLibrary();
            await loadFiles();
          } catch (error) {
            say(error.message, false);
            remove.disabled = false;
          }
        };
        actions.append(use, remove);
        card.append(image, title, details, actions);
        grid.append(card);
      });
    } catch (error) {
      grid.textContent = error.message;
      say(error.message, false);
    }
  }

  async function assignMedia(media, button) {
    try {
      const target = destination();
      button.disabled = true;
      await request('/api/admin/content-assets/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media_id: media.id, target_type: target.type, target_key: target.key, display_title: target.display_title })
      });
      say(`Image assigned to ${targetLabel()}.`, true);
      if (typeName() === 'achievement-photo') { await loadAchievementEntries(); await loadAchievementCards(); }
      await loadFiles();
      await loadMediaLibrary();
    } catch (error) {
      say(error.message, false);
    } finally {
      button.disabled = false;
    }
  }

  async function upload(e) {
    e.preventDefault();
    const kind = typeName();
    const file = $('pageUploadFile').files[0];
    if (kind === 'achievement-photo' && isNewAchievement()) return createAchievement();
    if (!file) return say('Choose a file to upload.', false);
    if (kind === 'achievement-photo' && !$('achievementGroup').value) return say('Choose an achievement group.', false);
    if (kind === 'achievement-photo' && !isNewAchievement() && !$('achievementCard').value) return say('Choose the exact achievement card.', false);
    if (kind === 'hero-slider' && !$('uploadTarget').value) return say('Choose a slide to replace.', false);
    if (kind === 'facility-photo' && !$('uploadTarget').value) return say('Choose the exact facility page.', false);
    if (kind === 'facility-photo' && !$('facilityPhotoSlot').value) return say('Choose a specific image location (card or gallery).', false);
    const extension = file.name.split('.').pop().toLowerCase();
    const fallbackTypes = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
    const mime = file.type || fallbackTypes[extension] || (extension === 'pdf' ? 'application/pdf' : '');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime))
      return say('Choose a JPG, PNG or WebP image.', false);
    if (file.size > 10 * 1024 * 1024)
      return say('Images may not exceed 10 MB.', false);

    const button = e.submitter
      || $('pageUploadForm').querySelector('button[type="submit"], button:not([type])');
    if (button) button.disabled = true;

    try {
      const key = targetKey();
      const displayTitle = kind === 'facility-photo' ? $('pageUploadCaption').value.trim() : $('mediaTitle').value.trim();
      console.log('[upload] POST /api/admin/content-assets', {
        type: kind, key, displayTitle,
        fileName: file.name, size: file.size, mime,
        selectedFacility: kind === 'facility-photo' ? selectedFacility() : null
      });
      const responseData = await request('/api/admin/content-assets', {
        method: 'POST',
        headers: { 'Content-Type': mime, 'X-Target-Type': kind, 'X-Target-Key': encodeURIComponent(key), 'X-File-Name': encodeURIComponent(file.name), 'X-Display-Title': encodeURIComponent(displayTitle) },
        body: file
      });
      console.log('[upload] server response:', responseData);

      const uploadedTo = targetLabel();
      const savedKey = responseData.target_key || key;
      const sizeLabel = file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;
      $('pageUploadFile').value = '';
      $('pageUploadCaption').value = '';
      $('mediaTitle').value = '';
      say(`UPLOAD CONFIRMED — File: ${file.name} (${sizeLabel}, ${mime}). Destination: ${uploadedTo}. Assignment: ${kind} / ${savedKey}. Server saved: ${responseData.file_name || file.name}.`, true);
      await loadFiles();
      await loadMediaLibrary();
      if (kind === 'achievement-photo') { await loadAchievementEntries(); await loadAchievementCards(); }

      if (kind === 'facility-photo') {
        const listText = $('pageUploadList').textContent || '';
        if (listText.includes('No files uploaded') || listText.includes('Could not find')) {
          const all = await fetch('/api/content-assets?target_type=facility-photo').then(r => r.json()).catch(() => []);
          const facility = selectedFacility();
          console.warn('[upload] file not found in list after upload', {
            key, allAssetsInDB: all, currentFacility: facility
          });
          say(`File uploaded to server, but it did not appear in the list. Check the browser console (F12) for details. (Saved key was "${key}".)`, false);
        }
      }
    } catch (error) {
      console.error('[upload] ERROR:', error);
      say(error.message, false);
    } finally { if (button) button.disabled = false; }
  }

  window.initPageUploads = function (adminEnabled = false) {
    if (initialized) {
      if (adminEnabled) initializeAdminPageContent();
      return;
    }
    initialized = true;
    $('uploadType').addEventListener('change', fillTargets);
    $('achievementMode').addEventListener('change', fillTargets);
    $('achievementGroup').addEventListener('change', () => {
      updateAchievementEntryFields();
      loadAchievementCards('');
    });
    ['achievementEntryYear', 'achievementEntryName'].forEach(id => $(id).addEventListener('input', updateDestinationSummary));
    $('facilityPhotoSlot').addEventListener('change', () => {
      updateDestinationSummary();
      loadFiles().catch(error => say(error.message, false));
    });
    $('uploadTarget').addEventListener('change', () => {
      if (typeName() === 'facility-photo') fillFacilityPhotoSlots();
      updateDestinationSummary();
      loadFiles().catch(error => say(error.message, false));
    });
    $('achievementCard').addEventListener('change', () => {
      updateDestinationSummary();
      loadFiles().catch(error => say(error.message, false));
    });
    $('pageUploadForm').addEventListener('submit', upload);
    $('mediaSearch').addEventListener('input', () => {
      clearTimeout(mediaSearchTimer);
      mediaSearchTimer = setTimeout(() => loadMediaLibrary(), 250);
    });
    loadMediaLibrary();
    loadFacilities().then(fillTargets).catch(error => say(error.message, false));
    if (adminEnabled) initializeAdminPageContent();
  };
})();