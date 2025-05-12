document.addEventListener('DOMContentLoaded', () => {
    const openModalBtn = document.getElementById('openModalBtn');
    const noteModal = document.getElementById('noteModal');
    const closeNoteModal = document.querySelector('.close');

    const noteTitle = document.getElementById('noteTitle');
    const noteContent = document.getElementById('noteContent');
    const noteColor = document.getElementById('noteColor');
    const addNoteBtn = document.getElementById('addNoteBtn');
    const notesContainer = document.getElementById('notesContainer');
    const searchInput = document.getElementById('searchInput');

    let notes = JSON.parse(localStorage.getItem('notes')) || [];

    const newReminderTimeInput = document.getElementById('newReminderTime');
    const reminderModal = document.getElementById('reminderModal');
    const closeReminderModal = document.getElementById('closeReminderModal');
    const reminderNoteTitle = document.getElementById('reminderNoteTitle');
    const saveReminderBtn = document.getElementById('saveReminderBtn');
    let currentNoteForReminder = null;


    // Event Listeners
    openModalBtn.addEventListener('click', () => noteModal.style.display = 'block');
    closeNoteModal.addEventListener('click', () => noteModal.style.display = 'none');
    window.addEventListener('click', (e) => e.target === noteModal && (noteModal.style.display = 'none'));

    // Reinder modal
    closeReminderModal.addEventListener('click', () =>  reminderModal.style.display = 'none');
    window.addEventListener('click', (e) => e.target === reminderModal && (reminderModal.style.display = 'none'));

    // Character Counter
    noteContent.addEventListener('input', updateCharCount);
    function updateCharCount() {
        const maxLength = 500;
        const currentLength = noteContent.value.length;
        document.getElementById('charCount').textContent =
            `${currentLength}/${maxLength}`;
        if (currentLength > maxLength) {
            noteContent.value = noteContent.value.substring(0, maxLength);
        }
    }

    // Save Note
    addNoteBtn.addEventListener('click', () => {
        const titleText = noteTitle.value.trim();
        const noteText = noteContent.value.trim();
        const reminderTime = document.getElementById('noteReminder').value;
        const tags = document.getElementById('noteTags').value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

        if (!titleText || !noteText) return;

        const noteObject = {
            title: titleText,
            content: noteText,
            color: noteColor.value,
            tags: tags || [],
            pinned: false,
            archived: false,
            timestamp: new Date().toLocaleString(),
            id: Date.now(),
            tags: tags || [],
            reminder: reminderTime ? new Date(reminderTime).toLocaleString() : null,
            reminderAlerted: false
        };

        notes.push(noteObject);
        saveNotes();
        resetModal();
        renderAllNotes();
    });

    function saveNotes() {
        localStorage.setItem('notes', JSON.stringify(notes));
    }

    function resetModal() {
        noteTitle.value = '';
        noteContent.value = '';
        document.getElementById('noteTags').value = '';
        document.getElementById('noteReminder').value = '';
        document.getElementById('charCount').textContent = '0/500';
        noteModal.style.display = 'none';
    }

    // Render Notes
    function renderAllNotes() {
        const searchTerm = searchInput.value.toLowerCase();
        const filtered = notes.filter(note => {
            const searchTerm = searchInput.value.toLowerCase();
            return (
                note.title.toLowerCase().includes(searchTerm) ||
                note.content.toLowerCase().includes(searchTerm) ||
                (note.tags || []).some(tag => tag.toLowerCase().includes(searchTerm)) 
            );
        });

        filtered.sort((a, b) => (b.pinned - a.pinned) || (b.id - a.id));
        notesContainer.innerHTML = '';
        filtered.forEach(renderNote);
    }

    function renderNote(note) {
        const noteElement = document.createElement('div');
        noteElement.className = 'note';
        noteElement.style.backgroundColor = note.color;
        noteElement.setAttribute('data-id', note.id);

        const titleElement = document.createElement('h3');
        titleElement.textContent = note.title;

        const timestampElement = document.createElement('p');
        timestampElement.textContent = `📅 ${note.timestamp}`;
        timestampElement.style.color = '#667';
        timestampElement.style.fontSize = '0.9em';

        const contentElement = document.createElement('p');
        contentElement.textContent = note.content;
        contentElement.style.display = 'none';

        // Tags 
        const tagsContainer = document.createElement('div');
        (note.tags || []).forEach(tag => {
            if (tag) {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                tagsContainer.appendChild(tagElement);
            }
        });

        // Buttons
        const toggleBtn = createButton('📖Open', () => toggleContent(contentElement, toggleBtn));
        const deleteBtn = createButton('🗑️Delete', () => confirmDelete(note));
        const editBtn = createButton('✏️Edit', () => editNote(note, titleElement, contentElement));
        const pinBtn = createButton(note.pinned ? '📌Unpin' : '📌Pin', () => togglePin(note));
        const archiveBtn = createButton('📦Archive', () => toggleArchive(note));

        // Reminder Badge
        if (note.reminder) {
            const now = new Date();
            const reminderTime = new Date(note.reminder);
            const reminderElement = document.createElement('div');
            reminderElement.className = 'reminder-badge';

            if (!note.reminderAlerted && reminderTime <= now) {
                note.reminderAlerted = true;
                reminderElement.textContent = '✅Reminder shown';
                reminderElement.style.backgroundColor = '#28a745';
                saveNotes();
            } else if (note.reminderAlerted) {
                reminderElement.textContent = '✅Reminder shown';
                reminderElement.style.backgroundColor = '#28a745';
            } else {
                reminderElement.textContent = `⏰${reminderTime.toLocaleString()}`;
                reminderElement.style.backgroundColor = '#ff9800';
            }

            // Accessibility
            reminderElement.setAttribute('role', 'status');
            reminderElement.setAttribute('aria-label', reminderElement.textContent);

            noteElement.appendChild(reminderElement);
        }

        const buttons = [toggleBtn, editBtn, pinBtn, archiveBtn, deleteBtn];
        // let newReminderTimeInput;
        const resetReminderBtn = createButton('🔁Reset Reminder', () => {
            currentNoteForReminder = note;
            newReminderTimeInput.value = "";
            reminderNoteTitle.textContent = `Note: ${note.title}`;
            reminderModal.style.display = 'block';
        });

        buttons.push(resetReminderBtn);


        // Assembly
        noteElement.append(
            titleElement,
            tagsContainer,
            timestampElement,
            createButtonGroup(buttons),
            contentElement
        );


        notesContainer.appendChild(noteElement);

    }

    // Helper Functions
    function createButton(text, onClick) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.addEventListener('click', onClick);
        return btn;
    }

    function createButtonGroup(buttons) {
        const group = document.createElement('div');
        group.className = 'button-group';
        buttons.forEach(btn => group.appendChild(btn));
        return group;
    }

    function toggleContent(contentElement, btn) {
        const isHidden = contentElement.style.display === 'none';
        contentElement.style.display = isHidden ? 'block' : 'none';
        btn.textContent = isHidden ? '📕Close' : '📖Open';
    }

    function confirmDelete(note) {
        if (confirm('Delete this note permanently?')) {
            notes = notes.filter(n => n.id !== note.id);
            saveNotes();
            renderAllNotes();
        }
    }

    function editNote(note, titleElement, contentElement) {
        const titleInput = document.createElement('input');
        titleInput.value = note.title;

        const contentTextarea = document.createElement('textarea');
        contentTextarea.value = note.content;
        contentTextarea.style.width = '100%';
        contentTextarea.style.height = '100px';

        titleElement.replaceWith(titleInput);
        contentElement.replaceWith(contentTextarea);

        const saveBtn = createButton('💾 Save', () => {
            note.title = titleInput.value.trim();
            note.content = contentTextarea.value.trim();
            saveNotes();
            renderAllNotes();
        });

        contentTextarea.parentNode.insertBefore(saveBtn, contentTextarea.nextSibling);
    }

    function togglePin(note) {
        note.pinned = !note.pinned;
        saveNotes();
        renderAllNotes();
    }

    function toggleArchive(note) {
        note.archived = !note.archived;
        saveNotes();
        renderAllNotes();
    }

    // Reminder System
    function checkReminders() {
        const now = new Date();
        notes.forEach(note => {
            if (note.reminder && !note.reminderAlerted) {
                const reminderTime = new Date(note.reminder);
                if (now >= reminderTime) {
                    showNotification(note);
                    note.reminderAlerted = true;
                    saveNotes();
                    renderAllNotes();
                }
            }
        });
    }

    function showNotification(note) {
        if (Notification.permission === 'granted') {
            new Notification(`⏰ ${note.title}`, {
                body: note.content,
                icon: 'notification.png'
            });
        }
        new Audio('notification.mp3').play().catch(console.error);
    }

    // Initialize
    searchInput.addEventListener('input', renderAllNotes);
    setInterval(checkReminders, 60000);
    if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }

    saveReminderBtn.addEventListener('click', () => {
        if (currentNoteForReminder) {
            const newTime = newReminderTimeInput.value;
            if (newTime) {
                const parsedTime = new Date(newTime);
                if (!isNaN(parsedTime)) {
                    currentNoteForReminder.reminder = parsedTime.toLocaleString();
                    currentNoteForReminder.reminderAlerted = false;
                    saveNotes();
                    renderAllNotes();
                    reminderModal.style.display = 'none';
                } else {
                    alert('Invalid date/time format.');
                }
            } else {
                alert('Please choose a valid date and time.');
            }
        }
    });

    renderAllNotes();
    
    const aboutModalBtn = document.getElementById('aboutModalBtn');
    const aboutModal = document.getElementById('aboutModal');
    const closeAboutModal = document.getElementById('closeAboutModal');

    // Open modal on button click
    aboutModalBtn.addEventListener('click', () => {
        aboutModal.style.display = 'block';
    });

    // Close modal when clicking the close button
    closeAboutModal.addEventListener('click', () => {
        aboutModal.style.display = 'none';
    });

    // Close modal when clicking outside the modal content
    window.addEventListener('click', (event) => {
        if (event.target === aboutModal) {
            aboutModal.style.display = 'none';
        }
    });

    const howToModalBtn = document.getElementById('howToModalBtn');
    const howToModal = document.getElementById('howToModal');
    const closeHowToModal = document.getElementById('closeHowToModal');

    howToModalBtn.addEventListener('click', () => {
        howToModal.style.display = 'block';
    });

    closeHowToModal.addEventListener('click', () => {
        howToModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === howToModal) {
            howToModal.style.display = 'none';
        }
    });

});
