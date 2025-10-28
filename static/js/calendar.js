import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';

document.addEventListener('DOMContentLoaded', () => {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return; // Only run if the page has a calendar

  const calendar = new Calendar(calendarEl, {
    // Config
    plugins: [dayGridPlugin, listPlugin, timeGridPlugin],
    initialView: 'dayGridMonth',
    selectable: true,

    // Header toolbar
    headerToolbar: {
    left: 'prev next today addEvent',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,listWeek,timeGridDay'
    },

    // Custom buttons
    customButtons: {
      addEvent: {
        //icon: 'custom-icon-class',  Then style it in CSS
        text: '+ Event',
        click: function () {
          resetModalForNew();
          
          // Trigger modal
          const modalEl = document.getElementById('modal');
          if (modalEl && window.bootstrap) {
              const bootstrapModal = bootstrap.Modal.getOrCreateInstance(modalEl);
              bootstrapModal.show();
          }
        }
      }
    },
    events: '/events',

    // Clicking on event
    eventClick: function(info) {
    const event = info.event;
    
    fillModalForEdit(event);

    // Show modal manually
    const modalEl = document.getElementById('modal');
    if (modalEl && window.bootstrap) {
        const bootstrapModal = bootstrap.Modal.getOrCreateInstance(modalEl);
        bootstrapModal.show();
    }

    info.jsEvent.preventDefault(); 
  },
    // Formats
    eventTimeFormat: { // like '14:30'
        hour: '2-digit',
        minute: '2-digit',
        meridiem: false,
        hour12: false
    },

    slotLabelFormat: { // like '14:30'
        hour: '2-digit',
        minute: '2-digit',
        meridiem: false,
        hour12: false
    }
  });

  calendar.render();

  // Add Bootstrap modal attributes to the custom button
  const btn = document.querySelector('.fc-addEvent-button');
  if (btn) {
    btn.setAttribute('data-bs-toggle', 'modal');
    btn.setAttribute('data-bs-target', '#modal');
    btn.setAttribute('data-bs-name', 'New Event');
  }

  // Handles modal content updates
  const Modal = document.getElementById('modal');
  if (Modal) {
    Modal.addEventListener('show.bs.modal', event => {
      const button = event.relatedTarget;
      if (button) {
        const modalName = button.getAttribute('data-bs-name');

        const modalTitle = Modal.querySelector('.modal-title');

        modalTitle.textContent = modalName;
      }
    });
  }
});

function fillModalForEdit(event) {
    const modalEl = document.getElementById('modal');
    if (!modalEl) return;

    // Retrieves the editable fields
    const form = document.getElementById('modal-form');
    const titleSpan = modalEl.querySelector('#modal-title');
    const descriptionTextarea = document.getElementById('event-description');
    const startDateInput = document.getElementById('event-datepicker-start');
    const endDateInput = document.getElementById('event-datepicker-end');
    const eventIdInput = document.getElementById('event-id-input');
    const deleteButton = document.getElementById('delete-event-button');

    // Fill in the retrieved data for the editable fields
    eventIdInput.value = event.id;
    titleSpan.value = event.title;
    descriptionTextarea.value = event.extendedProps.description || '';
    startDateInput.value = event.start;
    endDateInput.value = event.end;

    // Setup the modal for edit mode
    titleSpan.textContent = event.title;
    form.action = '/events/edit';
    // Activate delete button
    deleteButton.style.display = 'block';

    // Setup the delete action
    deleteButton.onclick = function() {
        if (confirm("Are you sude you want to delete it?")) {
            // Change route for deleting event
            fetch('/events/delete/' + event.id, {
                method: 'DELETE'
            })
            .then(response => {
              if (response.ok) {
                // Remove event and close modal
                event.remove(); 
                bootstrap.Modal.getInstance(modalEl).hide();
              } else {
                console.error('Server error deleting event:', response.status);
                alert('Error: Cannot delete event. Status: ' + response.status);
              }
            })
            .catch(error => console.error('Error with deleting event: ', error));
        }
    };
}

$('#event-datepicker').datepicker({
    format: "dd/mm/yy",
    weekStart: 1,
    startDate: 0,
    maxViewMode: 2,
    todayBtn: "linked",
    calendarWeeks: true,
    todayHighlight: true
});